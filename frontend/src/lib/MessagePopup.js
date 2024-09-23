import { Snackbar, Slide } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { diag } from '@opentelemetry/api'; // Import OpenTelemetry diagnostics

const MessagePopup = (props) => {
  const handleClose = (event, reason) => {
    diag.debug('handleClose called with reason:', reason); // Log the reason for handleClose
    if (reason === "clickaway") {
      diag.debug('handleClose exited due to clickaway reason'); // Log when exiting due to clickaway
      return;
    }
    diag.debug('Setting props.setOpen to false'); // Log before setting props.setOpen
    props.setOpen(false);
  };
  
  diag.debug('Rendering Snackbar with props:', { open: props.open, severity: props.severity, message: props.message }); // Log the props used in Snackbar
  return (
    <Snackbar open={props.open} onClose={handleClose} autoHideDuration={2000}>
      <Alert onClose={handleClose} severity={props.severity}>
        {props.message}
      </Alert>
    </Snackbar>
  );
};

export default MessagePopup;
