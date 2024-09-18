const express = require("express");
const mongoose = require("mongoose");
const jwtAuth = require("../lib/jwtAuth");
const { diag } = require('@opentelemetry/api');

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
  diag.debug('User type:', user.type);

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    return;
  }

  const data = req.body;
  diag.debug('Job data:', data);

  let job = new Job({
    userId: user._id,
    title: data.title,
    maxApplicants: data.maxApplicants,
    maxPositions: data.maxPositions,
    dateOfPosting: data.dateOfPosting,
    deadline: data.deadline,
    skillsets: data.skillsets,
    jobType: data.jobType,
    duration: data.duration,
    salary: data.salary,
    rating: data.rating,
  });

  job
    .save()
    .then(() => {
      diag.debug('Job added successfully');
      res.json({ message: "Job added successfully to the database" });
    })
    .catch((err) => {
      diag.error('Error adding job:', err);
      res.status(400).json(err);
    });
});

// to get all the jobs [pagination] [for recruiter personal and for everyone]
router.get("/jobs", jwtAuth, (req, res) => {
  let user = req.user;
  diag.debug('User type:', user.type);

  let findParams = {};
  let sortParams = {};

  if (user.type === "recruiter" && req.query.myjobs) {
    findParams = {
      ...findParams,
      userId: user._id,
    };
    diag.debug('Find params for recruiter:', findParams);
  }

  if (req.query.q) {
    findParams = {
      ...findParams,
      title: {
        $regex: new RegExp(req.query.q, "i"),
      },
    };
    diag.debug('Find params with query:', findParams);
  }

  if (req.query.jobType) {
    let jobTypes = [];
    if (Array.isArray(req.query.jobType)) {
      jobTypes = req.query.jobType;
    } else {
      jobTypes = [req.query.jobType];
    }
    diag.debug('Job types:', jobTypes);
    findParams = {
      ...findParams,
      jobType: {
        $in: jobTypes,
      },
    };
  }

  if (req.query.salaryMin && req.query.salaryMax) {
    findParams = {
      ...findParams,
      $and: [
        {
          salary: {
            $gte: parseInt(req.query.salaryMin),
          },
        },
        {
          salary: {
            $lte: parseInt(req.query.salaryMax),
          },
        },
      ],
    };
    diag.debug('Find params with salary range:', findParams);
  } else if (req.query.salaryMin) {
    findParams = {
      ...findParams,
      salary: {
        $gte: parseInt(req.query.salaryMin),
      },
    };
    diag.debug('Find params with minimum salary:', findParams);
  } else if (req.query.salaryMax) {
    findParams = {
      ...findParams,
      salary: {
        $lte: parseInt(req.query.salaryMax),
      },
    };
    diag.debug('Find params with maximum salary:', findParams);
  }

  if (req.query.duration) {
    findParams = {
      ...findParams,
      duration: {
        $lt: parseInt(req.query.duration),
      },
    };
    diag.debug('Find params with duration:', findParams);
  }

  if (req.query.asc) {
    if (Array.isArray(req.query.asc)) {
      req.query.asc.map((key) => {
        sortParams = {
          ...sortParams,
          [key]: 1,
        };
      });
    } else {
      sortParams = {
        ...sortParams,
        [req.query.asc]: 1,
      };
    }
    diag.debug('Sort params ascending:', sortParams);
  }

  if (req.query.desc) {
    if (Array.isArray(req.query.desc)) {
      req.query.desc.map((key) => {
        sortParams = {
          ...sortParams,
          [key]: -1,
        };
      });
    } else {
      sortParams = {
        ...sortParams,
        [req.query.desc]: -1,
      };
    }
    diag.debug('Sort params descending:', sortParams);
  }

  diag.debug('Final find params:', findParams);
  diag.debug('Final sort params:', sortParams);

  let arr = [
    {
      $lookup: {
        from: "recruiterinfos",
        localField: "userId",
        foreignField: "userId",
        as: "recruiter",
      },
    },
    { $unwind: "$recruiter" },
    { $match: findParams },
  ];

  if (Object.keys(sortParams).length > 0) {
    arr = [
      {
        $lookup: {
          from: "recruiterinfos",
          localField: "userId",
          foreignField: "userId",
          as: "recruiter",
        },
      },
      { $unwind: "$recruiter" },
      { $match: findParams },
      {
        $sort: sortParams,
      },
    ];
  }

  diag.debug('Aggregation pipeline:', arr);

  Job.aggregate(arr)
    .then((posts) => {
      if (posts == null) {
        diag.debug('No jobs found');
        res.status(404).json({
          message: "No job found",
        });
        return;
      }
      diag.debug('Jobs found:', posts.length);
      res.json(posts);
    })
    .catch((err) => {
      diag.error('Error fetching jobs:', err);
      res.status(400).json(err);
    });
});

// to get info about a particular job
router.get("/jobs/:id", jwtAuth, (req, res) => {
  Job.findOne({ _id: req.params.id })
    .then((job) => {
      if (job == null) {
        diag.debug('Job not found with id:', req.params.id);
        res.status(400).json({
          message: "Job does not exist",
        });
        return;
      }
      diag.debug('Job found:', job);
      res.json(job);
    })
    .catch((err) => {
      diag.error('Error fetching job:', err);
      res.status(400).json(err);
    });
});

// to update info of a particular job
router.put("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User type:', user.type);

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to change the job details",
    });
    return;
  }
  Job.findOne({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job == null) {
        diag.debug('Job not found for update with id:', req.params.id);
        res.status(404).json({
          message: "Job does not exist",
        });
        return;
      }
      const data = req.body;
      diag.debug('Update data:', data);

      if (data.maxApplicants) {
        job.maxApplicants = data.maxApplicants;
      }
      if (data.maxPositions) {
        job.maxPositions = data.maxPositions;
      }
      if (data.deadline) {
        job.deadline = data.deadline;
      }
      job
        .save()
        .then(() => {
          diag.debug('Job details updated successfully');
          res.json({
            message: "Job details updated successfully",
          });
        })
        .catch((err) => {
          diag.error('Error updating job details:', err);
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      diag.error('Error finding job for update:', err);
      res.status(400).json(err);
    });
});

// to delete a job
router.delete("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User type:', user.type);

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to delete the job",
    });
    return;
  }
  Job.findOneAndDelete({
    _id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job === null) {
        diag.debug('Job not found for deletion with id:', req.params.id);
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        return;
      }
      diag.debug('Job deleted successfully');
      res.json({
        message: "Job deleted successfully",
      });
    })
    .catch((err) => {
      diag.error('Error deleting job:', err);
      res.status(400).json(err);
    });
});

// get user's personal details
router.get("/user", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User type:', user.type);

  if (user.type === "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          diag.debug('Recruiter not found for user id:', user._id);
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.debug('Recruiter found:', recruiter);
        res.json(recruiter);
      })
      .catch((err) => {
        diag.error('Error fetching recruiter details:', err);
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          diag.debug('Job applicant not found for user id:', user._id);
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        diag.debug('Job applicant found:', jobApplicant);
        res.json(jobApplicant);
      })
      .catch((err) => {
        diag.error('Error fetching job applicant details:', err);
        res.status(400).json(err);
      });
  }
});

// get user details from id
router.get("/user/:id", jwtAuth, (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((userData) => {
      if (userData === null) {
        diag.debug('User not found with id:', req.params.id);
        res.status(404).json({
          message: "User does not exist",
        });
        return;
      }
      diag.debug('User found:', userData);

      if (userData.type === "recruiter") {
        Recruiter.findOne({ userId: userData._id })
          .then((recruiter) => {
            if (recruiter === null) {
              diag.debug('Recruiter not found for user id:', userData._id);
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            diag.debug('Recruiter found:', recruiter);
            res.json(recruiter);
          })
          .catch((err) => {
            diag.error('Error fetching recruiter details:', err);
            res.status(400).json(err);
          });
      } else {
        JobApplicant.findOne({ userId: userData._id })
          .then((jobApplicant) => {
            if (jobApplicant === null) {
              diag.debug('Job applicant not found for user id:', userData._id);
              res.status(404).json({
                message: "User does not exist",
              });
              return;
            }
            diag.debug('Job applicant found:', jobApplicant);
            res.json(jobApplicant);
          })
          .catch((err) => {
            diag.error('Error fetching job applicant details:', err);
            res.status(400).json(err);
          });
      }
    })
    .catch((err) => {
      diag.error('Error fetching user details:', err);
      res.status(400).json(err);
    });
});

// update user details
router.put("/user", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;
  diag.debug('User type:', user.type);
  diag.debug('Update data:', data);

  if (user.type == "recruiter") {
    Recruiter.findOne({ userId: user._id })
      .then((recruiter) => {
        if (recruiter == null) {
          diag.debug('Recruiter not found for update with user id:', user._id);
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        if (data.name) {
          recruiter.name = data.name;
        }
        if (data.contactNumber) {
          recruiter.contactNumber = data.contactNumber;
        }
        if (data.bio) {
          recruiter.bio = data.bio;
        }
        recruiter
          .save()
          .then(() => {
            diag.debug('Recruiter information updated successfully');
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            diag.error('Error updating recruiter information:', err);
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        diag.error('Error finding recruiter for update:', err);
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({ userId: user._id })
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          diag.debug('Job applicant not found for update with user id:', user._id);
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        if (data.name) {
          jobApplicant.name = data.name;
        }
        if (data.education) {
          jobApplicant.education = data.education;
        }
        if (data.skills) {
          jobApplicant.skills = data.skills;
        }
        if (data.resume) {
          jobApplicant.resume = data.resume;
        }
        if (data.profile) {
          jobApplicant.profile = data.profile;
        }
        diag.debug('Job applicant before save:', jobApplicant);
        jobApplicant
          .save()
          .then(() => {
            diag.debug('Job applicant information updated successfully');
            res.json({
              message: "User information updated successfully",
            });
          })
          .catch((err) => {
            diag.error('Error updating job applicant information:', err);
            res.status(400).json(err);
          });
      })
      .catch((err) => {
        diag.error('Error finding job applicant for update:', err);
        res.status(400).json(err);
      });
  }
});

// apply for a job [todo: test: done]
router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User type:', user.type);

  if (user.type != "applicant") {
    res.status(401).json({
      message: "You don't have permissions to apply for a job",
    });
    return;
  }
  const data = req.body;
  const jobId = req.params.id;
  diag.debug('Application data:', data);
  diag.debug('Job ID:', jobId);

  Application.findOne({
    userId: user._id,
    jobId: jobId,
    status: {
      $nin: ["deleted", "accepted", "cancelled"],
    },
  })
    .then((appliedApplication) => {
      diag.debug('Previously applied application:', appliedApplication);
      if (appliedApplication !== null) {
        res.status(400).json({
          message: "You have already applied for this job",
        });
        return;
      }

      Job.findOne({ _id: jobId })
        .then((job) => {
          if (job === null) {
            diag.debug('Job not found for application with id:', jobId);
            res.status(404).json({
              message: "Job does not exist",
            });
            return;
          }
          diag.debug('Job found for application:', job);

          Application.countDocuments({
            jobId: jobId,
            status: {
              $nin: ["rejected", "deleted", "cancelled", "finished"],
            },
          })
            .then((activeApplicationCount) => {
              diag.debug('Active application count for job:', activeApplicationCount);
              if (activeApplicationCount < job.maxApplicants) {
                Application.countDocuments({
                  userId: user._id,
                  status: {
                    $nin: ["rejected", "deleted", "cancelled", "finished"],
                  },
                })
                  .then((myActiveApplicationCount) => {
                    diag.debug('User active application count:', myActiveApplicationCount);
                    if (myActiveApplicationCount < 10) {
                      Application.countDocuments({
                        userId: user._id,
                        status: "accepted",
                      }).then((acceptedJobs) => {
                        diag.debug('User accepted jobs count:', acceptedJobs);
                        if (acceptedJobs === 0) {
                          const application = new Application({
                            userId: user._id,
                            recruiterId: job.userId,
                            jobId: job._id,
                            status: "applied",
                            sop: data.sop,
                          });
                          application
                            .save()
                            .then(() => {
                              diag.debug('Job application successful');
                              res.json({
                                message: "Job application successful",
                              });
                            })
                            .catch((err) => {
                              diag.error('Error saving job application:', err);
                              res.status(400).json(err);
                            });
                        } else {
                          res.status(400).json({
                            message:
                              "You already have an accepted job. Hence you cannot apply.",
                          });
                        }
                      });
                    } else {
                      res.status(400).json({
                        message:
                          "You have 10 active applications. Hence you cannot apply.",
                      });
                    }
                  })
                  .catch((err) => {
                    diag.error('Error counting user active applications:', err);
                    res.status(400).json(err);
                  });
              } else {
                res.status(400).json({
                  message: "Application limit reached",
                });
              }
            })
            .catch((err) => {
              diag.error('Error counting active applications for job:', err);
              res.status(400).json(err);
            });
        })
        .catch((err) => {
          diag.error('Error finding job for application:', err);
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      diag.error('Error checking previous application:', err);
      res.json(400).json(err);
    });
});

// recruiter gets applications for a particular job [pagination] [todo: test: done]
router.get("/jobs/:id/applications", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User type:', user.type);

  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to view job applications",
    });
    return;
  }
  const jobId = req.params.id;
  diag.debug('Job ID for applications:', jobId);

  let findParams = {
    jobId: jobId,
    recruiterId: user._id,
  };
  diag.debug('Find params for applications:', findParams);

  let sortParams = {};

  if (req.query.status) {
    findParams = {
      ...findParams,
      status: req.query.status,
    };
    diag.debug('Find params with status:', findParams);
  }

  Application.find(findParams)
    .collation({ locale: "en" })
    .sort(sortParams)
    .then((applications) => {
      diag.debug('Applications found:', applications.length);
      res.json(applications);
    })
    .catch((err) => {
      diag.error('Error fetching applications:', err);
      res.status(400).json(err);
    });
});

// recruiter/applicant gets all his applications [pagination]
router.get("/applications", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User type:', user.type);

  Application.aggregate([
    {
      $lookup: {
        from: "jobapplicantinfos",
        localField: "userId",
        foreignField: "userId",
        as: "jobApplicant",
      },
    },
    { $unwind: "$jobApplicant" },
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    { $unwind: "$job" },
    {
      $lookup: {
        from: "recruiterinfos",
        localField: "recruiterId",
        foreignField: "userId",
        as: "recruiter",
      },
    },
    { $unwind: "$recruiter" },
    {
      $match: {
        [user.type === "recruiter" ? "recruiterId" : "userId"]: user._id,
      },
    },
    {
      $sort: {
        dateOfApplication: -1,
      },
    },
  ])
    .then((applications) => {
      diag.debug('Applications found:', applications.length);
      res.json(applications);
    })
    .catch((err) => {
      diag.error('Error fetching applications:', err);
      res.status(400).json(err);
    });
});

// update status of application: [Applicant: Can cancel, Recruiter: Can do everything] [todo: test: done]
router.put("/applications/:id", jwtAuth, (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const status = req.body.status;
  diag.debug('User type:', user.type);
  diag.debug('Application ID:', id);
  diag.debug('New status:', status);

  if (user.type === "recruiter") {
    if (status === "accepted") {
      Application.findOne({
        _id: id,
        recruiterId: user._id,
      })
        .then((application) => {
          if (application === null) {
            diag.debug('Application not found for acceptance with id:', id);
            res.status(404).json({
              message: "Application not found",
            });
            return;
          }
          diag.debug('Application found for acceptance:', application);

          Job.findOne({
            _id: application.jobId,
            userId: user._id,
          }).then((job) => {
            if (job === null) {
              diag.debug('Job not found for application acceptance with id:', application.jobId);
              res.status(404).json({
                message: "Job does not exist",
              });
              return;
            }
            diag.debug('Job found for application acceptance:', job);

            Application.countDocuments({
              recruiterId: user._id,
              jobId: job._id,
              status: "accepted",
            }).then((activeApplicationCount) => {
              diag.debug('Active accepted application count:', activeApplicationCount);
              if (activeApplicationCount < job.maxPositions) {
                application.status = status;
                application.dateOfJoining = req.body.dateOfJoining;
                application
                  .save()
                  .then(() => {
                    Application.updateMany(
                      {
                        _id: {
                          $ne: application._id,
                        },
                        userId: application.userId,
                        status: {
                          $nin: [
                            "rejected",
                            "deleted",
                            "cancelled",
                            "accepted",
                            "finished",
                          ],
                        },
                      },
                      {
                        $set: {
                          status: "cancelled",
                        },
                      },
                      { multi: true }
                    )
                      .then(() => {
                        if (status === "accepted") {
                          Job.findOneAndUpdate(
                            {
                              _id: job._id,
                              userId: user._id,
                            },
                            {
                              $set: {
                                acceptedCandidates: activeApplicationCount + 1,
                              },
                            }
                          )
                            .then(() => {
                              diag.debug('Application accepted successfully');
                              res.json({
                                message: `Application ${status} successfully`,
                              });
                            })
                            .catch((err) => {
                              diag.error('Error updating job accepted candidates:', err);
                              res.status(400).json(err);
                            });
                        } else {
                          res.json({
                            message: `Application ${status} successfully`,
                          });
                        }
                      })
                      .catch((err) => {
                        diag.error('Error updating other applications:', err);
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    diag.error('Error saving application status:', err);
                    res.status(400).json(err);
                  });
              } else {
                res.status(400).json({
                  message: "All positions for this job are already filled",
                });
              }
            });
          });
        })
        .catch((err) => {
          diag.error('Error finding application for acceptance:', err);
          res.status(400).json(err);
        });
    } else {
      Application.findOneAndUpdate(
        {
          _id: id,
          recruiterId: user._id,
          status: {
            $nin: ["rejected", "deleted", "cancelled"],
          },
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((application) => {
          if (application === null) {
            diag.debug('Application status cannot be updated for id:', id);
            res.status(400).json({
              message: "Application status cannot be updated",
            });
            return;
          }
          diag.debug('Application status updated successfully');
          if (status === "finished") {
            res.json({
              message: `Job ${status} successfully`,
            });
          } else {
            res.json({
              message: `Application ${status} successfully`,
            });
          }
        })
        .catch((err) => {
          diag.error('Error updating application status:', err);
          res.status(400).json(err);
        });
    }
  } else {
    if (status === "cancelled") {
      diag.debug('Cancelling application with id:', id);
      Application.findOneAndUpdate(
        {
          _id: id,
          userId: user._id,
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((tmp) => {
          diag.debug('Application cancelled successfully:', tmp);
          res.json({
            message: `Application ${status} successfully`,
          });
        })
        .catch((err) => {
          diag.error('Error cancelling application:', err);
          res.status(400).json(err);
        });
    } else {
      res.status(401).json({
        message: "You don't have permissions to update job status",
      });
    }
  }
});

// get a list of final applicants for current job : recruiter
// get a list of final applicants for all his jobs : recuiter
router.get("/applicants", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User type:', user.type);

  if (user.type === "recruiter") {
    let findParams = {
      recruiterId: user._id,
    };
    if (req.query.jobId) {
      findParams = {
        ...findParams,
        jobId: new mongoose.Types.ObjectId(req.query.jobId),
      };
    }
    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        findParams = {
          ...findParams,
          status: { $in: req.query.status },
        };
      } else {
        findParams = {
          ...findParams,
          status: req.query.status,
        };
      }
    }
    diag.debug('Find params for applicants:', findParams);

    let sortParams = {};

    if (!req.query.asc && !req.query.desc) {
      sortParams = { _id: 1 };
    }

    if (req.query.asc) {
      if (Array.isArray(req.query.asc)) {
        req.query.asc.map((key) => {
          sortParams = {
            ...sortParams,
            [key]: 1,
          };
        });
      } else {
        sortParams = {
          ...sortParams,
          [req.query.asc]: 1,
        };
      }
    }

    if (req.query.desc) {
      if (Array.isArray(req.query.desc)) {
        req.query.desc.map((key) => {
          sortParams = {
            ...sortParams,
            [key]: -1,
          };
        });
      } else {
        sortParams = {
          ...sortParams,
          [req.query.desc]: -1,
        };
      }
    }
    diag.debug('Sort params for applicants:', sortParams);

    Application.aggregate([
      {
        $lookup: {
          from: "jobapplicantinfos",
          localField: "userId",
          foreignField: "userId",
          as: "jobApplicant",
        },
      },
      { $unwind: "$jobApplicant" },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      { $match: findParams },
      { $sort: sortParams },
    ])
      .then((applications) => {
        if (applications.length === 0) {
          diag.debug('No applicants found');
          res.status(404).json({
            message: "No applicants found",
          });
          return;
        }
        diag.debug('Applicants found:', applications.length);
        res.json(applications);
      })
      .catch((err) => {
        diag.error('Error fetching applicants:', err);
        res.status(400).json(err);
      });
  } else {
    res.status(400).json({
      message: "You are not allowed to access applicants list",
    });
  }
});

// to add or update a rating [todo: test]
router.put("/rating", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;
  diag.debug('User type:', user.type);
  diag.debug('Rating data:', data);

  if (user.type === "recruiter") {
    Rating.findOne({
      senderId: user._id,
      receiverId: data.applicantId,
      category: "applicant",
    })
      .then((rating) => {
        if (rating === null) {
          diag.debug('No existing rating found, creating new');
          Application.countDocuments({
            userId: data.applicantId,
            recruiterId: user._id,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              diag.debug('Accepted applicant count:', acceptedApplicant);
              if (acceptedApplicant > 0) {
                rating = new Rating({
                  category: "applicant",
                  receiverId: data.applicantId,
                  senderId: user._id,
                  rating: data.rating,
                });

                rating
                  .save()
                  .then(() => {
                    Rating.aggregate([
                      {
                        $match: {
                          receiverId: mongoose.Types.ObjectId(data.applicantId),
                          category: "applicant",
                        },
                      },
                      {
                        $group: {
                          _id: {},
                          average: { $avg: "$rating" },
                        },
                      },
                    ])
                      .then((result) => {
                        if (result === null) {
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;
                        diag.debug('Calculated average rating:', avg);

                        JobApplicant.findOneAndUpdate(
                          {
                            userId: data.applicantId,
                          },
                          {
                            $set: {
                              rating: avg,
                            },
                          }
                        )
                          .then((applicant) => {
                            if (applicant === null) {
                              res.status(400).json({
                                message:
                                  "Error while updating applicant's average rating",
                              });
                              return;
                            }
                            diag.debug('Applicant rating updated successfully');
                            res.json({
                              message: "Rating added successfully",
                            });
                          })
                          .catch((err) => {
                            diag.error('Error updating applicant rating:', err);
                            res.status(400).json(err);
                          });
                      })
                      .catch((err) => {
                        diag.error('Error calculating average rating:', err);
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    diag.error('Error saving new rating:', err);
                    res.status(400).json(err);
                  });
              } else {
                res.status(400).json({
                  message:
                    "Applicant didn't worked under you. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              diag.error('Error counting accepted applicants:', err);
              res.status(400).json(err);
            });
        } else {
          rating.rating = data.rating;
          rating
            .save()
            .then(() => {
              Rating.aggregate([
                {
                  $match: {
                    receiverId: mongoose.Types.ObjectId(data.applicantId),
                    category: "applicant",
                  },
                },
                {
                  $group: {
                    _id: {},
                    average: { $avg: "$rating" },
                  },
                },
              ])
                .then((result) => {
                  if (result === null) {
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  diag.debug('Calculated average rating:', avg);

                  JobApplicant.findOneAndUpdate(
                    {
                      userId: data.applicantId,
                    },
                    {
                      $set: {
                        rating: avg,
                      },
                    }
                  )
                    .then((applicant) => {
                      if (applicant === null) {
                        res.status(400).json({
                          message:
                            "Error while updating applicant's average rating",
                        });
                        return;
                      }
                      diag.debug('Applicant rating updated successfully');
                      res.json({
                        message: "Rating updated successfully",
                      });
                    })
                    .catch((err) => {
                      diag.error('Error updating applicant rating:', err);
                      res.status(400).json(err);
                    });
                })
                .catch((err) => {
                  diag.error('Error calculating average rating:', err);
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              diag.error('Error saving updated rating:', err);
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        diag.error('Error finding existing rating:', err);
        res.status(400).json(err);
      });
  } else {
    Rating.findOne({
      senderId: user._id,
      receiverId: data.jobId,
      category: "job",
    })
      .then((rating) => {
        diag.debug('Existing rating:', rating);
        if (rating === null) {
          Application.countDocuments({
            userId: user._id,
            jobId: data.jobId,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              diag.debug('Accepted applicant count for job:', acceptedApplicant);
              if (acceptedApplicant > 0) {
                rating = new Rating({
                  category: "job",
                  receiverId: data.jobId,
                  senderId: user._id,
                  rating: data.rating,
                });

                rating
                  .save()
                  .then(() => {
                    Rating.aggregate([
                      {
                        $match: {
                          receiverId: mongoose.Types.ObjectId(data.jobId),
                          category: "job",
                        },
                      },
                      {
                        $group: {
                          _id: {},
                          average: { $avg: "$rating" },
                        },
                      },
                    ])
                      .then((result) => {
                        if (result === null) {
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;
                        diag.debug('Calculated average rating for job:', avg);

                        Job.findOneAndUpdate(
                          {
                            _id: data.jobId,
                          },
                          {
                            $set: {
                              rating: avg,
                            },
                          }
                        )
                          .then((foundJob) => {
                            if (foundJob === null) {
                              res.status(400).json({
                                message:
                                  "Error while updating job's average rating",
                              });
                              return;
                            }
                            diag.debug('Job rating updated successfully');
                            res.json({
                              message: "Rating added successfully",
                            });
                          })
                          .catch((err) => {
                            diag.error('Error updating job rating:', err);
                            res.status(400).json(err);
                          });
                      })
                      .catch((err) => {
                        diag.error('Error calculating average job rating:', err);
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    diag.error('Error saving new job rating:', err);
                    res.status(400).json(err);
                  });
              } else {
                res.status(400).json({
                  message:
                    "You haven't worked for this job. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              diag.error('Error counting accepted applicants for job:', err);
              res.status(400).json(err);
            });
        } else {
          rating.rating = data.rating;
          rating
            .save()
            .then(() => {
              Rating.aggregate([
                {
                  $match: {
                    receiverId: mongoose.Types.ObjectId(data.jobId),
                    category: "job",
                  },
                },
                {
                  $group: {
                    _id: {},
                    average: { $avg: "$rating" },
                  },
                },
              ])
                .then((result) => {
                  if (result === null) {
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  diag.debug('Calculated average rating for job:', avg);

                  Job.findOneAndUpdate(
                    {
                      _id: data.jobId,
                    },
                    {
                      $set: {
                        rating: avg,
                      },
                    }
                  )
                    .then((foundJob) => {
                      if (foundJob === null) {
                        res.status(400).json({
                          message: "Error while updating job's average rating",
                        });
                        return;
                      }
                      diag.debug('Job rating updated successfully');
                      res.json({
                        message: "Rating added successfully",
                      });
                    })
                    .catch((err) => {
                      diag.error('Error updating job rating:', err);
                      res.status(400).json(err);
                    });
                })
                .catch((err) => {
                  diag.error('Error calculating average job rating:', err);
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              diag.error('Error saving updated job rating:', err);
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        diag.error('Error finding existing job rating:', err);
        res.status(400).json(err);
      });
  }
});

// get personal rating
router.get("/rating", jwtAuth, (req, res) => {
  const user = req.user;
  diag.debug('User type:', user.type);

  Rating.findOne({
    senderId: user._id,
    receiverId: req.query.id,
    category: user.type === "recruiter" ? "applicant" : "job",
  }).then((rating) => {
    if (rating === null) {
      diag.debug('No personal rating found');
      res.json({
        rating: -1,
      });
      return;
    }
    diag.debug('Personal rating found:', rating.rating);
    res.json({
      rating: rating.rating,
    });
  });
});

module.exports = router;
