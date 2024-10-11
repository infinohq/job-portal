import { Snackbar, Slide } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { trace } from '@opentelemetry/api';

const MessagePopup = (props) => {
  const tracer = trace.getTracer('default');

  const handleClose = (event, reason) => {
    tracer.startActiveSpan('handleClose', span => {
      span.addEvent(`handleClose called with reason: ${reason}`);
      if (reason === "clickaway") {
        span.addEvent('Clickaway reason detected, not closing Snackbar');
        span.end();
        return;
      }
      span.addEvent('Closing Snackbar');
      props.setOpen(false);
      span.end();
    });
  };

  return (
    <Snackbar open={props.open} onClose={handleClose} autoHideDuration={2000}>
      <Alert onClose={handleClose} severity={props.severity}>
        {props.message}
      </Alert>
    </Snackbar>
  );
};

export default MessagePopup;
