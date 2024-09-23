import { Snackbar, Slide } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { diag } from '@opentelemetry/api';

const MessagePopup = (props) => {
  const handleClose = (event, reason) => {
    diag.debug('handleClose called with reason:', reason);
    if (reason === "clickaway") {
      diag.debug('handleClose early return due to clickaway');
      return;
    }
    diag.debug('Setting open to false');
    props.setOpen(false);
  };
  diag.debug('Rendering MessagePopup with props:', props);
  return (
    <Snackbar open={props.open} onClose={handleClose} autoHideDuration={2000}>
      <Alert onClose={handleClose} severity={props.severity}>
        {props.message}
      </Alert>
    </Snackbar>
  );
};

export default MessagePopup;
