const db = require("../models");
const Review = db.reviews;
const Op = db.Sequelize.Op;

// Create and Save a new Review
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.productId || !req.body.userId || !req.body.rating || !req.body.comment) {
      return res.status(400).send({
        message: "Product ID, user ID, rating, and comment are required!"
      });
    }

    // Check if product exists
    const product = await db.products.findByPk(req.body.productId);
    if (!product) {
      return res.status(404).send({
        message: "Product not found!"
      });
    }

    // Create a Review
    const review = {
      productId: req.body.productId,
      userId: req.body.userId,
      userName: req.body.userName,
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
      verifiedPurchase: req.body.verifiedPurchase || false,
      images: req.body.images || []
    };

    // Save Review in the database
    const data = await Review.create(review);
    
    // Update product rating and review count
    const productReviews = await Review.findAll({
      where: { productId: req.body.productId }
    });
    
    const totalRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const avgRating = totalRating / productReviews.length;
    
    await db.products.update({
      rating: avgRating,
      reviewCount: productReviews.length
    }, {
      where: { id: req.body.productId }
    });

    const createdReview = await Review.findByPk(data.id, {
      include: [
        { model: db.products, as: 'product' },
        { model: db.users, as: 'user' }
      ]
    });

    res.send(createdReview);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Review."
    });
  }
};

// Retrieve all Reviews for a product
exports.findAll = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { rating, verifiedPurchase, sortBy = 'newest' } = req.query;
    
    const where = { productId: productId };
    
    if (rating) where.rating = rating;
    if (verifiedPurchase !== undefined) {
      where.verifiedPurchase = verifiedPurchase === 'true';
    }
    
    let order = [['createdAt', 'DESC']];
    if (sortBy === 'helpful') order = [['helpfulCount', 'DESC']];
    if (sortBy === 'rating_desc') order = [['rating', 'DESC']];
    if (sortBy === 'rating_asc') order = [['rating', 'ASC']];

    const reviews = await Review.findAll({
      where,
      order,
      include: [{ model: db.users, as: 'user' }]
    });

    res.send(reviews);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving reviews."
    });
  }
};

// Find a single Review with id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const review = await Review.findByPk(id, {
      include: [
        { model: db.products, as: 'product' },
        { model: db.users, as: 'user' }
      ]
    });

    if (review) {
      res.send(review);
    } else {
      res.status(404).send({
        message: `Cannot find Review with id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error retrieving Review with id=" + req.params.id
    });
  }
};

// Update a Review by id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await Review.update(req.body, {
      where: { id: id }
    });

    if (updated) {
      // Update product rating if rating changed
      if (req.body.rating) {
        const review = await Review.findByPk(id);
        if (review) {
          const productReviews = await Review.findAll({
            where: { productId: review.productId }
          });
          
          const totalRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0);
          const avgRating = totalRating / productReviews.length;
          
          await db.products.update({
            rating: avgRating
          }, {
            where: { id: review.productId }
          });
        }
      }

      const updatedReview = await Review.findByPk(id);
      res.send({
        message: "Review was updated successfully.",
        review: updatedReview
      });
    } else {
      res.status(404).send({
        message: `Cannot update Review with id=${id}. Maybe Review was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating Review with id=" + req.params.id
    });
  }
};

// Delete a Review with id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    // Get review before deletion to update product rating
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).send({
        message: `Review with id=${id} not found.`
      });
    }

    const deleted = await Review.destroy({
      where: { id: id }
    });

    if (deleted) {
      // Update product rating
      const productReviews = await Review.findAll({
        where: { productId: review.productId }
      });
      
      if (productReviews.length > 0) {
        const totalRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const avgRating = totalRating / productReviews.length;
        
        await db.products.update({
          rating: avgRating,
          reviewCount: productReviews.length
        }, {
          where: { id: review.productId }
        });
      } else {
        await db.products.update({
          rating: 0,
          reviewCount: 0
        }, {
          where: { id: review.productId }
        });
      }

      res.send({
        message: "Review was deleted successfully!"
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not delete Review with id=" + req.params.id
    });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const id = req.params.id;
    
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).send({
        message: `Review with id=${id} not found.`
      });
    }

    await Review.update({
      helpfulCount: review.helpfulCount + 1
    }, {
      where: { id: id }
    });

    const updatedReview = await Review.findByPk(id);
    res.send({
      message: "Review marked as helpful.",
      review: updatedReview
    });
  } catch (err) {
    res.status(500).send({
      message: "Error marking review as helpful."
    });
  }
};

// Get reviews by user
exports.findByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const reviews = await Review.findAll({
      where: { userId: userId },
      include: [{ model: db.products, as: 'product' }],
      order: [['createdAt', 'DESC']]
    });

    res.send(reviews);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Error retrieving reviews for user ${req.params.userId}`
    });
  }
};