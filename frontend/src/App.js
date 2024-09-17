import { createContext, useState } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Grid, makeStyles } from "@material-ui/core";
import { trace, metrics } from '@opentelemetry/api';

import Welcome, { ErrorPage } from "./component/Welcome";
import Navbar from "./component/Navbar";
import Login from "./component/Login";
import Logout from "./component/Logout";
import Signup from "./component/Signup";
import Home from "./component/Home";
import Applications from "./component/Applications";
import Profile from "./component/Profile";
import CreateJobs from "./component/recruiter/CreateJobs";
import MyJobs from "./component/recruiter/MyJobs";
import JobApplications from "./component/recruiter/JobApplications";
import AcceptedApplicants from "./component/recruiter/AcceptedApplicants";
import RecruiterProfile from "./component/recruiter/Profile";
import MessagePopup from "./lib/MessagePopup";
import isAuth, { userType } from "./lib/isAuth";

const useStyles = makeStyles((theme) => ({
  body: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "98vh",
    paddingTop: "64px",
    boxSizing: "border-box",
    width: "100%",
  },
}));

export const SetPopupContext = createContext();

const meter = metrics.getMeter('default');
const loginCounter = meter.createCounter('login_counter', {
  description: 'Count of user logins',
});
const signupCounter = meter.createCounter('signup_counter', {
  description: 'Count of user signups',
});
const jobCreationCounter = meter.createCounter('job_creation_counter', {
  description: 'Count of jobs created by recruiters',
});
const applicationCounter = meter.createCounter('application_counter', {
  description: 'Count of job applications submitted',
});

function App() {
  const tracer = trace.getTracer('default');
  const classes = useStyles();
  const [popup, setPopup] = useState({
    open: false,
    severity: "",
    message: "",
  });

  tracer.startActiveSpan('App Component Render', span => {
    span.addEvent('Rendering App component');
    span.setAttribute('popupState', JSON.stringify(popup));

    return (
      <BrowserRouter>
        <SetPopupContext.Provider value={setPopup}>
          <Grid container direction="column">
            <Grid item xs>
              <Navbar />
            </Grid>
            <Grid item className={classes.body}>
              <Switch>
                <Route exact path="/">
                  <Welcome />
                </Route>
                <Route exact path="/login">
                  <Login />
                  {loginCounter.add(1)}
                </Route>
                <Route exact path="/signup">
                  <Signup />
                  {signupCounter.add(1)}
                </Route>
                <Route exact path="/logout">
                  <Logout />
                </Route>
                <Route exact path="/home">
                  <Home />
                </Route>
                <Route exact path="/applications">
                  <Applications />
                  {applicationCounter.add(1)}
                </Route>
                <Route exact path="/profile">
                  {userType() === "recruiter" ? (
                    <RecruiterProfile />
                  ) : (
                    <Profile />
                  )}
                </Route>
                <Route exact path="/addjob">
                  <CreateJobs />
                  {jobCreationCounter.add(1)}
                </Route>
                <Route exact path="/myjobs">
                  <MyJobs />
                </Route>
                <Route exact path="/job/applications/:jobId">
                  <JobApplications />
                </Route>
                <Route exact path="/employees">
                  <AcceptedApplicants />
                </Route>
                <Route>
                  <ErrorPage />
                </Route>
              </Switch>
            </Grid>
          </Grid>
          <MessagePopup
            open={popup.open}
            setOpen={(status) =>
              setPopup({
                ...popup,
                open: status,
              })
            }
            severity={popup.severity}
            message={popup.message}
          />
        </SetPopupContext.Provider>
      </BrowserRouter>
    );
  });
}

export default App;
