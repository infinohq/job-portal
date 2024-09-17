import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  makeStyles,
} from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { trace, metrics } from '@opentelemetry/api';

import isAuth, { userType } from "../lib/isAuth";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

const meter = metrics.getMeter('default');
const buttonClickCounter = meter.createCounter('button_clicks', {
  description: 'Count of button clicks in the navbar',
});
const userTypeCounter = meter.createCounter('user_type', {
  description: 'Count of user types accessing the navbar',
});
const authStatusCounter = meter.createCounter('auth_status', {
  description: 'Count of authenticated vs unauthenticated users',
});

const Navbar = (props) => {
  const classes = useStyles();
  let history = useHistory();
  const tracer = trace.getTracer('default');

  const handleClick = (location) => {
    const span = tracer.startSpan('handleClick');
    span.setAttribute('location', location);
    buttonClickCounter.add(1, { location });
    console.log(location);
    history.push(location);
    span.end();
  };

  const authStatus = isAuth();
  authStatusCounter.add(1, { status: authStatus ? 'authenticated' : 'unauthenticated' });

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" className={classes.title}>
          Job Portal
        </Typography>
        {authStatus ? (
          userType() === "recruiter" ? (
            <>
              {userTypeCounter.add(1, { type: 'recruiter' })}
              <Button color="inherit" onClick={() => handleClick("/home")}>
                Home
              </Button>
              <Button color="inherit" onClick={() => handleClick("/addjob")}>
                Add Jobs
              </Button>
              <Button color="inherit" onClick={() => handleClick("/myjobs")}>
                My Jobs
              </Button>
              <Button color="inherit" onClick={() => handleClick("/employees")}>
                Employees
              </Button>
              <Button color="inherit" onClick={() => handleClick("/profile")}>
                Profile
              </Button>
              <Button color="inherit" onClick={() => handleClick("/logout")}>
                Logout
              </Button>
            </>
          ) : (
            <>
              {userTypeCounter.add(1, { type: 'job_seeker' })}
              <Button color="inherit" onClick={() => handleClick("/home")}>
                Home
              </Button>
              <Button
                color="inherit"
                onClick={() => handleClick("/applications")}
              >
                Applications
              </Button>
              <Button color="inherit" onClick={() => handleClick("/profile")}>
                Profile
              </Button>
              <Button color="inherit" onClick={() => handleClick("/logout")}>
                Logout
              </Button>
            </>
          )
        ) : (
          <>
            <Button color="inherit" onClick={() => handleClick("/login")}>
              Login
            </Button>
            <Button color="inherit" onClick={() => handleClick("/signup")}>
              Signup
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
