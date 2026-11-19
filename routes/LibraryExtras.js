const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Book = require("../models/Book");

const supplierSchema = new mongoose.Schema({
  supplierName: { type: String, required: true, trim: true },
  contactPerson: String, phone: String, email: String, address: String,
  status: { type: Boolean, default: true }
}, { timestamps: true });
const purchaseSchema = new mongoose.Schema({
  purchaseNumber: { type: String, unique: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "LibrarySupplier", required: true },
  items: [{
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  }],
  purchaseDate: { type: Date, default: Date.now },
  expectedDate: Date, receivedDate: Date,
  totalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ["Ordered", "Received", "Cancelled"], default: "Ordered" },
  remarks: String
}, { timestamps: true });
const lossSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  quantity: { type: Number, required: true, min: 1 },
  type: { type: String, enum: ["Lost", "Damaged"], required: true },
  reason: { type: String, required: true },
  reportedDate: { type: Date, default: Date.now },
  reportedBy: String,
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  stockAdjusted: { type: Boolean, default: false }
}, { timestamps: true });
const auditSchema = new mongoose.Schema({
  auditNumber: { type: String, unique: true },
  auditDate: { type: Date, default: Date.now },
  remarks: String,
  status: { type: String, enum: ["Draft", "Completed"], default: "Draft" },
  items: [{
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    systemQuantity: { type: Number, required: true, min: 0 },
    countedQuantity: { type: Number, required: true, min: 0 },
    difference: { type: Number, default: 0 }
  }]
}, { timestamps: true });
const digitalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: String, category: String,
  resourceType: { type: String, enum: ["PDF", "eBook", "Audio", "Video", "Link"], default: "PDF" },
  resourceUrl: { type: String, required: true },
  description: String,
  accessLevel: { type: String, enum: ["All", "Students", "Teachers"], default: "All" },
  status: { type: Boolean, default: true }
}, { timestamps: true });

const Supplier = mongoose.models.LibrarySupplier || mongoose.model("LibrarySupplier", supplierSchema);
const Purchase = mongoose.models.LibraryPurchase || mongoose.model("LibraryPurchase", purchaseSchema);
const LossDamage = mongoose.models.LibraryLossDamage || mongoose.model("LibraryLossDamage", lossSchema);
const StockAudit = mongoose.models.LibraryStockAudit || mongoose.model("LibraryStockAudit", auditSchema);
const DigitalResource = mongoose.models.LibraryDigitalResource || mongoose.model("LibraryDigitalResource", digitalSchema);

const sendError = (res, error) => res.status(500).json({ status: 500, message: error.message });
const asyncRoute = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => sendError(res, e));

// SUPPLIERS
router.get("/suppliers", asyncRoute(async (req,res) => res.json({status:200,data:await Supplier.find({status:true}).sort({createdAt:-1})})));
router.post("/suppliers", asyncRoute(async (req,res) => {
  const doc = await Supplier.create(req.body);
  res.status(201).json({status:201,message:"Supplier added successfully",data:doc});
}));
router.put("/suppliers/:id", asyncRoute(async (req,res) => {
  const doc = await Supplier.findByIdAndUpdate(req.params.id, req.body, {new:true,runValidators:true});
  if(!doc) return res.status(404).json({status:404,message:"Supplier not found"});
  res.json({status:200,message:"Supplier updated successfully",data:doc});
}));
router.delete("/suppliers/:id", asyncRoute(async (req,res) => {
  const doc = await Supplier.findByIdAndUpdate(req.params.id,{status:false},{new:true});
  if(!doc) return res.status(404).json({status:404,message:"Supplier not found"});
  res.json({status:200,message:"Supplier deactivated"});
}));

// PURCHASES; stock increases only once when order is marked Received.
router.get("/purchases", asyncRoute(async (req,res) => res.json({status:200,data:await Purchase.find().populate("supplierId","supplierName").populate("items.bookId","bookName bookCode").sort({createdAt:-1})})));
router.post("/purchases", asyncRoute(async (req,res) => {
  const items = (req.body.items || []).map(x => ({...x,quantity:Number(x.quantity),unitPrice:Number(x.unitPrice)}));
  if(!req.body.supplierId || !items.length || items.some(x=>!x.bookId || x.quantity<1 || x.unitPrice<0)) return res.status(400).json({status:400,message:"Supplier and valid purchase items are required"});
  const totalAmount = items.reduce((s,x)=>s+x.quantity*x.unitPrice,0);
  const doc = await Purchase.create({...req.body,items,totalAmount,purchaseNumber:req.body.purchaseNumber || `PO-${Date.now()}`,status:"Ordered"});
  res.status(201).json({status:201,message:"Purchase order created",data:doc});
}));
router.patch("/purchases/:id/receive", asyncRoute(async (req,res) => {
  const order = await Purchase.findById(req.params.id);
  if(!order) return res.status(404).json({status:404,message:"Purchase order not found"});
  if(order.status!=="Ordered") return res.status(400).json({status:400,message:"Only Ordered purchases can be received"});
  for(const line of order.items) {
    const book = await Book.findById(line.bookId);
    if(!book) return res.status(404).json({status:404,message:`Book ${line.bookId} not found`});
    book.totalCopies = Number(book.totalCopies||0) + line.quantity;
    book.availableCopies = Number(book.availableCopies||0) + line.quantity;
    await book.save();
  }
  order.status="Received"; order.receivedDate=new Date(); await order.save();
  res.json({status:200,message:"Purchase received and stock updated",data:order});
}));
router.patch("/purchases/:id/cancel", asyncRoute(async (req,res) => {
  const order=await Purchase.findById(req.params.id);
  if(!order) return res.status(404).json({status:404,message:"Purchase order not found"});
  if(order.status!=="Ordered") return res.status(400).json({status:400,message:"Only Ordered purchases can be cancelled"});
  order.status="Cancelled"; await order.save();
  res.json({status:200,message:"Purchase cancelled",data:order});
}));

// LOST / DAMAGED; approval removes available copies from stock.
router.get("/loss-damage", asyncRoute(async (req,res) => res.json({status:200,data:await LossDamage.find().populate("bookId","bookName bookCode totalCopies availableCopies").sort({createdAt:-1})})));
router.post("/loss-damage", asyncRoute(async (req,res) => {
  const qty=Number(req.body.quantity);
  const book=await Book.findById(req.body.bookId);
  if(!book) return res.status(404).json({status:404,message:"Book not found"});
  if(!Number.isInteger(qty)||qty<1) return res.status(400).json({status:400,message:"Quantity must be a positive integer"});
  if(qty>Number(book.availableCopies||0)) return res.status(400).json({status:400,message:"Quantity exceeds available copies"});
  const doc=await LossDamage.create({...req.body,quantity:qty});
  res.status(201).json({status:201,message:"Lost/damaged report submitted for approval",data:doc});
}));
router.patch("/loss-damage/:id/decision", asyncRoute(async (req,res) => {
  const doc=await LossDamage.findById(req.params.id);
  if(!doc) return res.status(404).json({status:404,message:"Report not found"});
  if(doc.status!=="Pending") return res.status(400).json({status:400,message:"Report already processed"});
  if(!["Approved","Rejected"].includes(req.body.status)) return res.status(400).json({status:400,message:"Decision must be Approved or Rejected"});
  if(req.body.status==="Approved") {
    const book=await Book.findById(doc.bookId);
    if(!book || Number(book.availableCopies||0)<doc.quantity) return res.status(400).json({status:400,message:"Insufficient available stock to adjust"});
    book.availableCopies-=doc.quantity;
    book.totalCopies=Math.max(0,Number(book.totalCopies||0)-doc.quantity);
    await book.save(); doc.stockAdjusted=true;
  }
  doc.status=req.body.status; await doc.save();
  res.json({status:200,message:`Report ${doc.status.toLowerCase()}`,data:doc});
}));

// STOCK AUDIT; completed audit optionally reconciles stock to counted quantity.
router.get("/audits", asyncRoute(async (req,res) => res.json({status:200,data:await StockAudit.find().populate("items.bookId","bookName bookCode").sort({createdAt:-1})})));
router.post("/audits", asyncRoute(async (req,res) => {
  const items=(req.body.items||[]).map(x=>({...x,systemQuantity:Number(x.systemQuantity),countedQuantity:Number(x.countedQuantity),difference:Number(x.countedQuantity)-Number(x.systemQuantity)}));
  if(!items.length || items.some(x=>!x.bookId || !Number.isInteger(x.countedQuantity)||x.countedQuantity<0)) return res.status(400).json({status:400,message:"At least one book with valid counted quantity is required"});
  const doc=await StockAudit.create({...req.body,items,auditNumber:req.body.auditNumber||`AUD-${Date.now()}`,status:"Draft"});
  res.status(201).json({status:201,message:"Stock audit saved as Draft",data:doc});
}));
router.patch("/audits/:id/complete", asyncRoute(async (req,res) => {
  const audit=await StockAudit.findById(req.params.id);
  if(!audit) return res.status(404).json({status:404,message:"Audit not found"});
  if(audit.status==="Completed") return res.status(400).json({status:400,message:"Audit already completed"});
  if(req.body.reconcile===true) {
    for(const line of audit.items) {
      const book=await Book.findById(line.bookId);
      if(!book) return res.status(404).json({status:404,message:"Book not found during reconciliation"});
      const issued=Number(book.totalCopies||0)-Number(book.availableCopies||0);
      if(line.countedQuantity<issued) return res.status(400).json({status:400,message:`Count for ${book.bookName} is below currently issued copies`});
      book.totalCopies=line.countedQuantity;
      book.availableCopies=line.countedQuantity-issued;
      await book.save();
    }
  }
  audit.status="Completed"; await audit.save();
  res.json({status:200,message:req.body.reconcile===true?"Audit completed and stock reconciled":"Audit completed without changing stock",data:audit});
}));

// DIGITAL LIBRARY
router.get("/digital-resources", asyncRoute(async (req,res) => res.json({status:200,data:await DigitalResource.find({status:true}).sort({createdAt:-1})})));
router.post("/digital-resources", asyncRoute(async (req,res) => {
  const doc=await DigitalResource.create(req.body);
  res.status(201).json({status:201,message:"Digital resource added",data:doc});
}));
router.put("/digital-resources/:id", asyncRoute(async (req,res) => {
  const doc=await DigitalResource.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});
  if(!doc) return res.status(404).json({status:404,message:"Digital resource not found"});
  res.json({status:200,message:"Digital resource updated",data:doc});
}));
router.delete("/digital-resources/:id", asyncRoute(async (req,res) => {
  const doc=await DigitalResource.findByIdAndUpdate(req.params.id,{status:false},{new:true});
  if(!doc) return res.status(404).json({status:404,message:"Digital resource not found"});
  res.json({status:200,message:"Digital resource deactivated"});
}));
module.exports = router;
