import { Snackbar, Slide } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { diag } from '@opentelemetry/api';

const MessagePopup = (props) => {
  const handleClose = (event, reason) => {
    diag.debug('handleClose called', { event, reason });
    if (reason === "clickaway") {
      diag.debug('handleClose exit due to clickaway', { reason });
      return;
    }
    diag.debug('Setting open to false');
    props.setOpen(false);
  };

  diag.debug('Rendering Snackbar', { open: props.open, severity: props.severity, message: props.message });
  return (
    <Snackbar open={props.open} onClose={handleClose} autoHideDuration={2000}>
      <Alert onClose={handleClose} severity={props.severity}>
        {props.message}
      </Alert>
    </Snackbar>
  );
};

export default MessagePopup;
