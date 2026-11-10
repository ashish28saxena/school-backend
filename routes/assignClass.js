const express= require("express");
const assignClass=require("../models/AssignClass");
const router=express.Router();
const Class = require("../models/Class");
const Section = require("../models/Section");

// router.get("/",async(req,resp)=>{
//       try{
//                let result= await assignClass.find();
//                resp.send({
//             status:200,
//             message:"Data fetch Sucessfully",
//             data:result
//            })
//       }catch(error)
//       {
//            resp.send({
//             status:500,
//             message:error
//            })
//       }
// })

router.get("/filter-options", async (req, resp) => {
  try {
    const [classIds, sectionIds] = await Promise.all([
      assignClass.distinct("classId"),
      assignClass.distinct("sectionId"),
      
    ]);

    const [classes, sections] = await Promise.all([
      Class.find({ _id: { $in: classIds } }).sort({ className: 1 }),
      Section.find({ _id: { $in: sectionIds } }).sort({ sectionName: 1 }),
     
    ]);

    return resp.status(200).json({
      success: true,
      classes,
      sections,
      
    });
  } catch (error) {
    return resp.status(500).json({ success: false, message: error.message });
  }
});

router.get("/", async (req, resp) => {
  try {
    let offset = parseInt(req.query.offset) || 0;
    let limit = parseInt(req.query.limit) || 10;

    offset = Math.max(0, offset);
    limit = Math.max(1, Math.min(100, limit));

    const { search, classId, sectionId, status } = req.query;
    const filter = {};

    // Class / Section / Subject (valid ObjectId ho tabhi lagao)
    if (classId && mongoose.isValidObjectId(classId)) filter.classId = classId;
    if (sectionId && mongoose.isValidObjectId(sectionId))
      filter.sectionId = sectionId;
   


    if (status === "true") filter.status = true;
    if (status === "false") filter.status = false;

    // Teacher search: pehle naam se teacher dhoondo, phir unki IDs se filter
    if (search && search.trim()) {
      const words = search.trim().split(/\s+/).map(escapeRegex);

      // Har word firstName ya lastName me milna chahiye ("ram sharma" bhi chalega)
      const teachers = await Teacher.find({
        $and: words.map((w) => ({
          $or: [
            { firstName: { $regex: w, $options: "i" } },
            { lastName: { $regex: w, $options: "i" } },
          ],
        })),
      }).select("_id");

      filter.teacherID = { $in: teachers.map((t) => t._id) };
    }

    const [result, total] = await Promise.all([
      assignClass
        .find(filter)
        .populate("teacherID")
        .populate("classId")
        .populate("sectionId")
        
        .sort({ _id: -1 })
        .skip(offset)
        .limit(limit),
      assignClass.countDocuments(filter), // filter ke hisaab se total
    ]);

    return resp.status(200).json({
      success: true,
      total,
      offset,
      limit,
      data: result,
      status: 200,
      message: "data fetch Sucessfully",
    });
  } catch (error) {
    return resp.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
});


router.post("/submit",async(req,resp)=>{
     try{
        const { teacherID,classId,sectionId,academicYear}=req.body;
        let result= new assignClass({
                teacherID,
                classId,
                sectionId,
                academicYear
        })
         let a= await result.save();
        resp.send({
            status:200,
            message:"Assign Class Sucessfully",
            data:a
         })

     }catch(error)
     {
         resp.send({
            status:500,
            message:error
         })
     }
})

router.delete("/delete/:id", async (req, resp) => {
  try {
    const result = await assignClass.findByIdAndDelete(req.params.id);

    if (!result) {
      return resp.status(404).json({
        status: 404,
        message: "Assign Class not found",
      });
    }

    return resp.status(200).json({
      status: 200,
      message: "Assign Class deleted successfully",
      data: result,
    });
  } catch (error) {
    console.log("Delete Error:", error);

    return resp.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


router.get("/edit/:id", async (req, resp) => {
  try {
    let result = await assignClass.findById(req.params.id);
    resp.send({
      status: 200,
      data: result,
      message: "data fetch Sucessfully",
    });
  } catch (error) {
    resp.send({
      status: 500,
      message: error.message,
    });
  }
});

router.put("/update/:id", async (req, resp) => {
  try {
    const { teacherID, classId, sectionId, academicYear, status } = req.body;
    let result = await assignClass.findByIdAndUpdate(req.params.id, {
      teacherID,
      classId,
      sectionId,
      academicYear,
      status,
    });
    resp.send({
      status: 200,
      message: "data Update Sucessfully",
      data: result,
    });
  } catch (error) {
    resp.send({
      status: 500,
      message: error.message,
    });
  }
});

module.exports=router;