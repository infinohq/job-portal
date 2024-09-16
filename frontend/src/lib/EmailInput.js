import { TextField } from "@material-ui/core";
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('default');

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

  return (
    <TextField
      label={label}
      variant="outlined"
      value={value}
      onChange={onChange}
      helperText={inputErrorHandler.email.message}
      onBlur={(event) => {
        const span = tracer.startSpan('EmailInput onBlur');
        span.setAttribute('inputValue', event.target.value);
        if (event.target.value === "") {
          span.addEvent('Input is empty');
          if (required) {
            span.addEvent('Input is required');
            handleInputError("email", true, "Email is required");
          } else {
            span.addEvent('Input is not required');
            handleInputError("email", false, "");
          }
        } else {
          const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          const isEmailValid = re.test(String(event.target.value).toLowerCase());
          span.setAttribute('isEmailValid', isEmailValid);
          if (isEmailValid) {
            span.addEvent('Email format is correct');
            handleInputError("email", false, "");
          } else {
            span.addEvent('Email format is incorrect');
            handleInputError("email", true, "Incorrect email format");
          }
        }
        span.end();
      }}
      error={inputErrorHandler.email.error}
      className={className}
    />
  );
};

export default EmailInput;