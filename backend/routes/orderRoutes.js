
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// GET: Logged-in user's order history
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Orders fetched successfully!",
      orders,
    });
  } catch (error) {
    console.error("Fetch orders error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching orders.",
    });
  }
});

// GET: All orders (Admin only)
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "All orders fetched successfully!",
        orders,
      });
    } catch (error) {
      console.error("Admin fetch orders error:", error.message);

      return res.status(500).json({
        message: "Server error while fetching all orders.",
      });
    }
  }
);

// POST: Place a new order and decrease stock
router.post("/", authMiddleware, async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Your cart is empty.",
    });
  }

  // Validate cart items
  for (const item of items) {
    if (
      !item ||
      !mongoose.Types.ObjectId.isValid(item.product) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return res.status(400).json({
        message: "Invalid product or quantity.",
      });
    }
  }

  let session;

  try {
    session = await mongoose.startSession();

    let savedOrder;

    await session.withTransaction(async () => {
      const orderItems = [];
      const stockNeeded = new Map();
      let totalAmount = 0;

      // Fetch products and prepare order items
      for (const item of items) {
        const productData = await Product.findById(item.product)
          .session(session);

        if (!productData) {
          const error = new Error("PRODUCT_NOT_FOUND");
          error.code = "PRODUCT_NOT_FOUND";
          throw error;
        }

        orderItems.push({
          product: productData._id,
          name: productData.name,
          price: productData.price,
          quantity: item.quantity,
        });

        totalAmount += productData.price * item.quantity;

        const productId = productData._id.toString();

        stockNeeded.set(
          productId,
          (stockNeeded.get(productId) || 0) + item.quantity
        );
      }

      // Decrease stock only if enough stock is available
      for (const [productId, quantity] of stockNeeded) {
        const result = await Product.updateOne(
          {
            _id: productId,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          { session }
        );

        if (result.modifiedCount !== 1) {
          const error = new Error("INSUFFICIENT_STOCK");
          error.code = "INSUFFICIENT_STOCK";
          throw error;
        }
      }

      // Create order in the same transaction
      const createdOrders = await Order.create(
        [
          {
            user: req.userId,
            items: orderItems,
            totalAmount,
          },
        ],
        { session }
      );

      savedOrder = createdOrders[0];
    });

    return res.status(201).json({
      message: "Order placed successfully!",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Order error:", error.message);

    if (error.code === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "A product in your cart was not found.",
      });
    }

    if (error.code === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        message: "Insufficient stock for one or more products.",
      });
    }

    return res.status(500).json({
      message: "Server error while placing order.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

// PATCH: Admin-only order status update
router.patch(
  "/:orderId/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status.",
      });
    }

    const allowedTransitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Shipped", "Cancelled"],
      Shipped: ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };

    let session;

    try {
      session = await mongoose.startSession();

      let updatedOrder;

      await session.withTransaction(async () => {
        const order = await Order.findById(orderId).session(session);

        if (!order) {
          const error = new Error("ORDER_NOT_FOUND");
          error.code = "ORDER_NOT_FOUND";
          throw error;
        }

        if (!allowedTransitions[order.status]?.includes(status)) {
          const error = new Error("INVALID_TRANSITION");
          error.code = "INVALID_TRANSITION";
          throw error;
        }

        // Restore stock if the order is cancelled
        if (status === "Cancelled") {
          for (const item of order.items) {
            const result = await Product.updateOne(
              { _id: item.product },
              { $inc: { stock: item.quantity } },
              { session }
            );

            if (result.modifiedCount !== 1) {
              const error = new Error("PRODUCT_NOT_FOUND");
              error.code = "PRODUCT_NOT_FOUND";
              throw error;
            }
          }
        }

        order.status = status;
        await order.save({ session });

        updatedOrder = order;
      });

      return res.status(200).json({
        message: "Order status updated successfully!",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Status update error:", error.message);

      if (error.code === "ORDER_NOT_FOUND") {
        return res.status(404).json({
          message: "Order not found.",
        });
      }

      if (error.code === "INVALID_TRANSITION") {
        return res.status(400).json({
          message: "This order status change is not allowed.",
        });
      }

      if (error.code === "PRODUCT_NOT_FOUND") {
        return res.status(409).json({
          message: "A product in this order could not be found.",
        });
      }

      return res.status(500).json({
        message: "Server error while updating order status.",
      });
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }
);

module.exports = router;