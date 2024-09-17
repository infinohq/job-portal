import { Snackbar, Slide } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { diag, metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('message-popup-meter');
const messagePopupCounter = meter.createCounter('message_popup_count', {
  description: 'Count of message popups displayed',
});
const messagePopupCloseCounter = meter.createCounter('message_popup_close_count', {
  description: 'Count of message popups closed',
});
const messagePopupClickawayCounter = meter.createCounter('message_popup_clickaway_count', {
  description: 'Count of message popups closed due to clickaway',
});

const MessagePopup = (props) => {
  const handleClose = (event, reason) => {
    diag.debug('handleClose called', { event, reason });
    if (reason === "clickaway") {
      diag.debug('handleClose exit due to clickaway', { reason });
      messagePopupClickawayCounter.add(1);
      return;
    }
    diag.debug('Setting open to false');
    props.setOpen(false);
    messagePopupCloseCounter.add(1);
  };

  diag.debug('Rendering Snackbar', { open: props.open, severity: props.severity, message: props.message });
  messagePopupCounter.add(1);
  return (
    <Snackbar open={props.open} onClose={handleClose} autoHideDuration={2000}>
      <Alert onClose={handleClose} severity={props.severity}>
        {props.message}
      </Alert>
    </Snackbar>
  );
};

export default MessagePopup;
