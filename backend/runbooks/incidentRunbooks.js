const incidentRunbooks = [
  {
    id: 'database-unavailable',
    title: 'Database Unavailable Runbook',
    category: 'Database',
    keywords: [
      'database',
      'db',
      'connection',
      'unavailable',
      'timeout',
      'mongodb',
    ],
    content: `
If the application database is unavailable:

1. Verify that the database service is running.
2. Check database connection configuration.
3. Verify network connectivity between the application and database.
4. Review recent database and application logs.
5. Check whether connection limits have been reached.
6. Review recent deployments or configuration changes.
7. If necessary, restart the affected database connection or service according to operational procedures.
`,
  },

  {
    id: 'login-failure',
    title: 'User Login Failure Runbook',
    category: 'Authentication',
    keywords: [
      'login',
      'authentication',
      'password',
      'token',
      'jwt',
      'sign in',
    ],
    content: `
If users cannot log in:

1. Verify that the authentication service is available.
2. Check authentication API responses and status codes.
3. Review application logs for authentication errors.
4. Verify JWT or session configuration.
5. Confirm that database access for user accounts is working.
6. Check whether a recent deployment changed authentication behavior.
7. Test login using a known test account.
`,
  },

  {
    id: 'slow-application',
    title: 'Slow Application Performance Runbook',
    category: 'Performance',
    keywords: [
      'slow',
      'latency',
      'performance',
      'loading',
      'response time',
      'timeout',
    ],
    content: `
If the application is responding slowly:

1. Measure API response times.
2. Check application CPU and memory utilization.
3. Review database query performance.
4. Look for slow or failing external API requests.
5. Review application logs for timeout errors.
6. Compare performance with recent deployments.
7. Identify which endpoint or service is contributing the most latency.
`,
  },

  {
    id: 'api-errors',
    title: 'API Error Runbook',
    category: 'API',
    keywords: [
      'api',
      '500',
      'error',
      'endpoint',
      'request',
      'response',
    ],
    content: `
If an API endpoint is failing:

1. Identify the affected endpoint.
2. Check the HTTP status code.
3. Review backend logs for the failed request.
4. Validate request parameters and payload.
5. Verify dependent services are available.
6. Check database connectivity.
7. Review recent deployments affecting the endpoint.
`,
  },
];

module.exports = incidentRunbooks;