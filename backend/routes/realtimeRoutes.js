const express = require('express');

const authMiddleware = require(
  '../middleware/authMiddleware'
);

const {
  addClient,
  getClientCount,
} = require(
  '../services/sseService'
);

const router = express.Router();

const getUserId = (req) => {
  return (
    req.user.userId ||
    req.user.id ||
    req.user._id
  );
};

// -----------------------------------
// REAL-TIME EVENT STREAM
// -----------------------------------

router.get(
  '/stream',
  authMiddleware,
  (req, res) => {
    const userId =
      getUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({
          error:
            'User information not found in token',
        });
    }

    res.setHeader(
      'Content-Type',
      'text/event-stream'
    );

    res.setHeader(
      'Cache-Control',
      'no-cache'
    );

    res.setHeader(
      'Connection',
      'keep-alive'
    );

    res.setHeader(
      'X-Accel-Buffering',
      'no'
    );

    res.flushHeaders();

    const removeClient =
      addClient(
        userId,
        res
      );

    res.write(
      `event: connected\n` +
        `data: ${JSON.stringify(
          {
            connected: true,

            clientCount:
              getClientCount(
                userId
              ),

            timestamp:
              new Date(),
          }
        )}\n\n`
    );

    const heartbeat =
      setInterval(() => {
        res.write(
          `event: heartbeat\n` +
            `data: ${JSON.stringify(
              {
                timestamp:
                  new Date(),
              }
            )}\n\n`
        );
      }, 25000);

    req.on(
      'close',
      () => {
        clearInterval(
          heartbeat
        );

        removeClient();
      }
    );
  }
);

module.exports = router;