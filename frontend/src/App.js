import { createContext, useState } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Grid, makeStyles } from "@material-ui/core";
import { trace } from '@opentelemetry/api';

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
              span.addEvent('Rendering Navbar component');
              <Navbar />
            </Grid>
            <Grid item className={classes.body}>
              <Switch>
                <Route exact path="/">
                  span.addEvent('Rendering Welcome component');
                  <Welcome />
                </Route>
                <Route exact path="/login">
                  span.addEvent('Rendering Login component');
                  <Login />
                </Route>
                <Route exact path="/signup">
                  span.addEvent('Rendering Signup component');
                  <Signup />
                </Route>
                <Route exact path="/logout">
                  span.addEvent('Rendering Logout component');
                  <Logout />
                </Route>
                <Route exact path="/home">
                  span.addEvent('Rendering Home component');
                  <Home />
                </Route>
                <Route exact path="/applications">
                  span.addEvent('Rendering Applications component');
                  <Applications />
                </Route>
                <Route exact path="/profile">
                  span.addEvent('Rendering Profile component');
                  {userType() === "recruiter" ? (
                    <RecruiterProfile />
                  ) : (
                    <Profile />
                  )}
                </Route>
                <Route exact path="/addjob">
                  span.addEvent('Rendering CreateJobs component');
                  <CreateJobs />
                </Route>
                <Route exact path="/myjobs">
                  span.addEvent('Rendering MyJobs component');
                  <MyJobs />
                </Route>
                <Route exact path="/job/applications/:jobId">
                  span.addEvent('Rendering JobApplications component');
                  <JobApplications />
                </Route>
                <Route exact path="/employees">
                  span.addEvent('Rendering AcceptedApplicants component');
                  <AcceptedApplicants />
                </Route>
                <Route>
                  span.addEvent('Rendering ErrorPage component');
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
