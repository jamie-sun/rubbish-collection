const { getCollectionDates } = require("./get-collection-dates");
const { sendNotification } = require("./send-notification");

const SEPARATOR = "-".repeat(40);

async function main(testAddress) {
  let subscriptions;
  let targetDate;

  // Check if run is manual trigger from test UI, or daily run from Github Action
  if (testAddress) {
    subscriptions = JSON.parse(testAddress || "[]");
    console.log(
      'Running test notification for "1/261 Remuera Road Remuera, Auckland 1050"...',
    );
    console.log(
      `TEST_ADDRESS = ${JSON.stringify(JSON.parse(testAddress), null, 2)}`,
    );
  } else {
    subscriptions = JSON.parse(process.env.SUBSCRIPTIONS || "[]");
    targetDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Pacific/Auckland",
    }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
  }

  if (subscriptions.length === 0) {
    console.log("No subscriptions configured. Set the SUBSCRIPTIONS secret.");
    return;
  }

  targetDate &&
    console.log(`Checking for collections on ${targetDate} (NZ date)...`);

  for (const sub of subscriptions) {
    const { label, addressId, ntfyTopic } = sub;

    console.log(SEPARATOR);
    console.log(`Checking ${label} (addressId: ${addressId})...`);

    try {
      const collections = await getCollectionDates(addressId);

      const tomorrow_collection = targetDate
        ? collections.find((c) => c.date === targetDate)
        : collections[0];

      if (tomorrow_collection) {
        console.log("Collection found from Auckland Council database...");
        console.log(JSON.stringify(tomorrow_collection, null, 2));

        const { isRecycling } = tomorrow_collection;

        const dateLabel = new Intl.DateTimeFormat("en-NZ", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "Pacific/Auckland",
        }).format(new Date(tomorrow_collection.date));

        const message = [`Rubbish & Food scraps: ${dateLabel}`];
        if (isRecycling) {
          message.push(`Recycling: ${dateLabel}`);
        }

        const payload = {
          topic: ntfyTopic,
          title: `Rubbish day tomorrow`,
          message: message.join("\n"),
          tags: "recycle",
        };

        console.log(SEPARATOR);
        console.log("Sending payload to ntfy for phone notification...");
        console.log(JSON.stringify(payload, null, 2));

        await sendNotification(payload);
      } else {
        console.log(`No collection tomorrow for ${label}.`);
      }
    } catch (err) {
      console.log(`Error checking ${label}: ${err.message}`);

      // Send a phone notification when a reminder check fails
      await sendNotification({
        topic: ntfyTopic,
        title: "Bin reminder error",
        message: err.message,
        tags: "warning",
      });
    }
  }

  console.log(SEPARATOR);
  console.log("Done.");
}

module.exports = { main };

// Run from GitHub Actions
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
