import { TextField } from "@material-ui/core";
import { trace } from '@opentelemetry/api';

const EmailInput = (props) => {
  const {
    label,
    value,
    onChange,
    inputErrorHandler,
    handleInputError,
    required,
    className,
  } = props;

  const tracer = trace.getTracer('default');

  return (
    <TextField
      label={label}
      variant="outlined"
      value={value}
      onChange={onChange}
      helperText={inputErrorHandler.email.message}
      onBlur={(event) => {
        tracer.startActiveSpan('onBlur', span => {
          span.addEvent('onBlur event triggered', { value: event.target.value });
          if (event.target.value === "") {
            if (required) {
              span.addEvent('Email is required');
              handleInputError("email", true, "Email is required");
            } else {
              span.addEvent('Email is not required and field is empty');
              handleInputError("email", false, "");
            }
          } else {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            span.addEvent('Email regex pattern created');
            if (re.test(String(event.target.value).toLowerCase())) {
              span.addEvent('Email format is correct');
              handleInputError("email", false, "");
            } else {
              span.addEvent('Incorrect email format');
              handleInputError("email", true, "Incorrect email format");
            }
          }
          span.end();
        });
      }}
      error={inputErrorHandler.email.error}
      className={className}
    />
  );
};

export default EmailInput;
