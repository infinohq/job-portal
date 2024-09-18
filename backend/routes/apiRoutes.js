const express = require("express");
const mongoose = require("mongoose");
const jwtAuth = require("../lib/jwtAuth");
const { trace } = require("@opentelemetry/api");

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");
const Job = require("../db/Job");
const Application = require("../db/Application");
const Rating = require("../db/Rating");

const router = express.Router();

// To add new job
router.post("/jobs", jwtAuth, (req, res) => {
  const user = req.user;
  const tracer = trace.getTracer("express");
  const span = tracer.startSpan("POST /jobs");

  if (user.type != "recruiter") {
    span.addEvent("User type is not recruiter");
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    span.end();
    return;
  }

  const data = req.body;

  let job
