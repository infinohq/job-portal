import { createContext, useState } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Grid, makeStyles } from "@material-ui/core";
import { diag } from '@opentelemetry/api';

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

function App() {
  const classes = useStyles();
  diag.debug('useStyles applied with classes:', classes);
  const [popup, setPopup] = useState({
    open: false,
    severity: "",
    message: "",
  });
  diag.debug('Initial popup state:', popup);
  return (
    <BrowserRouter>
      <SetPopupContext.Provider value={setPopup}>
        <Grid container direction="column">
          <Grid item xs>
            <Navbar />
            diag.debug('Navbar component rendered');
          </Grid>
          <Grid item className={classes.body}>
            <Switch>
              <Route exact path="/">
                <Welcome />
                diag.debug('Route "/" matched, Welcome component rendered');
              </Route>
              <Route exact path="/login">
                <Login />
                diag.debug('Route "/login" matched, Login component rendered');
              </Route>
              <Route exact path="/signup">
                <Signup />
                diag.debug('Route "/signup" matched, Signup component rendered');
              </Route>
              <Route exact path="/logout">
                <Logout />
                diag.debug('Route "/logout" matched, Logout component rendered');
              </Route>
              <Route exact path="/home">
                <Home />
                diag.debug('Route "/home" matched, Home component rendered');
              </Route>
              <Route exact path="/applications">
                <Applications />
                diag.debug('Route "/applications" matched, Applications component rendered');
              </Route>
              <Route exact path="/profile">
                {userType() === "recruiter" ? (
                  <RecruiterProfile />
                ) : (
                  <Profile />
                )}
                diag.debug('Route "/profile" matched, userType:', userType());
              </Route>
              <Route exact path="/addjob">
                <CreateJobs />
                diag.debug('Route "/addjob" matched, CreateJobs component rendered');
              </Route>
              <Route exact path="/myjobs">
                <MyJobs />
                diag.debug('Route "/myjobs" matched, MyJobs component rendered');
              </Route>
              <Route exact path="/job/applications/:jobId">
                <JobApplications />
                diag.debug('Route "/job/applications/:jobId" matched, JobApplications component rendered');
              </Route>
              <Route exact path="/employees">
                <AcceptedApplicants />
                diag.debug('Route "/employees" matched, AcceptedApplicants component rendered');
              </Route>
              <Route>
                <ErrorPage />
                diag.debug('No route matched, ErrorPage component rendered');
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
        diag.debug('MessagePopup component rendered with state:', popup);
      </SetPopupContext.Provider>
    </BrowserRouter>
  );
}

export default App;
