import { Grid, Typography } from "@material-ui/core";
import { diag, metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('job-portal-meter');
const welcomePageViewsCounter = meter.createCounter('welcome_page_views', {
  description: 'Counts the number of views on the Welcome page'
});
const errorPageViewsCounter = meter.createCounter('error_page_views', {
  description: 'Counts the number of views on the Error page'
});

const Welcome = (props) => {
  diag.debug('Rendering Welcome component with props:', props);
  welcomePageViewsCounter.add(1);
  return (
    <Grid
      container
      item
      direction="column"
      alignItems="center"
      justify="center"
      style={{ padding: "30px", minHeight: "93vh" }}
    >
      <Grid item>
        <Typography variant="h2">Welcome to Job Portal</Typography>
      </Grid>
    </Grid>
  );
};

export const ErrorPage = (props) => {
  diag.debug('Rendering ErrorPage component with props:', props);
  errorPageViewsCounter.add(1);
  return (
    <Grid
      container
      item
      direction="column"
      alignItems="center"
      justify="center"
      style={{ padding: "30px", minHeight: "93vh" }}
    >
      <Grid item>
        <Typography variant="h2">Error 404</Typography>
      </Grid>
    </Grid>
  );
};

export default Welcome;
