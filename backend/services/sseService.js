const clientsByUser = new Map();

const getUserKey = (userId) => {
  return String(userId);
};

const addClient = (
  userId,
  res
) => {
  const userKey =
    getUserKey(userId);

  if (
    !clientsByUser.has(
      userKey
    )
  ) {
    clientsByUser.set(
      userKey,
      new Set()
    );
  }

  const userClients =
    clientsByUser.get(
      userKey
    );

  userClients.add(res);

  return () => {
    userClients.delete(res);

    if (
      userClients.size === 0
    ) {
      clientsByUser.delete(
        userKey
      );
    }
  };
};

const broadcastEvent = (
  userId,
  eventName,
  data
) => {
  const userKey =
    getUserKey(userId);

  const userClients =
    clientsByUser.get(
      userKey
    );

  if (
    !userClients ||
    userClients.size === 0
  ) {
    return;
  }

  const payload =
    `event: ${eventName}\n` +
    `data: ${JSON.stringify(
      data
    )}\n\n`;

  userClients.forEach(
    (client) => {
      client.write(payload);
    }
  );
};

const getClientCount = (
  userId
) => {
  if (userId) {
    const userKey =
      getUserKey(userId);

    return (
      clientsByUser.get(
        userKey
      )?.size || 0
    );
  }

  let total = 0;

  clientsByUser.forEach(
    (userClients) => {
      total +=
        userClients.size;
    }
  );

  return total;
};

module.exports = {
  addClient,
  broadcastEvent,
  getClientCount,
};