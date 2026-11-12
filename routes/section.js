
const express = require("express");
const router = express.Router();

const Section = require("../models/Section");

// GET ALL SECTIONS
router.get("/", async (req, resp) => {
  try {
    let result = await Section.find({
      deletedAt: null,
    });

    resp.send({
      status: 200,
      message: "Section fetch successfully",
      data: result,
    });
  } catch (error) {
    resp.status(500).send({
      status: 500,
      message: error.message,
    });
  }
});

// CREATE SECTION
router.post("/submit", async (req, resp) => {
  try {
    const { sectionName, status } = req.body;

    const sectionData = new Section({
      sectionName,
      status: status ?? true,
    });

    let result = await sectionData.save();

    resp.send({
      status: 200,
      message: "Section created successfully",
      data: result,
    });
  } catch (error) {
    resp.status(500).send({
      status: 500,
      message: error.message,
    });
  }
});

// UPDATE SECTION
router.put("/update/:id", async (req, resp) => {
  try {
    const { sectionName, status } = req.body;

    let result = await Section.findByIdAndUpdate(
      req.params.id,
      {
        sectionName,
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!result) {
      return resp.status(404).send({
        status: 404,
        message: "Section not found",
      });
    }

    resp.send({
      status: 200,
      message: "Section updated successfully",
      data: result,
    });
  } catch (error) {
    resp.status(500).send({
      status: 500,
      message: error.message,
    });
  }
});

// DELETE SECTION (SOFT DELETE)
router.delete("/delete/:id", async (req, resp) => {
  try {
    let result = await Section.findByIdAndUpdate(
      req.params.id,
      {
        deletedAt: new Date(),
        status: false,
      },
      { new: true }
    );

    if (!result) {
      return resp.status(404).send({
        status: 404,
        message: "Section not found",
      });
    }

    resp.send({
      status: 200,
      message: "Section deleted successfully",
      data: result,
    });
  } catch (error) {
    resp.status(500).send({
      status: 500,
      message: error.message,
    });
  }
});

// GET SECTION BY ID
router.get("/edit/:id", async (req, resp) => {
  try {
    let result = await Section.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    resp.send({
      status: 200,
      data: result,
      message: "Record fetched successfully",
    });
  } catch (error) {
    resp.status(500).send({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;
