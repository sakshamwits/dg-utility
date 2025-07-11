import { notCancellableState } from "../util/orderState.js";

function isoDurationToMilliseconds(iso) {
  const regex = /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/;
  const match = iso.match(regex);

  if (!match) return 0;

  const days = parseInt(match[1] || "0", 10);
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  const seconds = parseInt(match[4] || "0", 10);

  return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
}

export const getPromiseBuffers = (type) => {
  if (type === "cancellation") {
    return [
      { domain: "ONDC:RET10", name: "Grocery H", value: 0 },
      { domain: "ONDC:RET10", name: "Grocery NH", value: 0 },
      { domain: "ONDC:RET11", name: "F&B H", value: 0 },
      { domain: "ONDC:RET11", name: "F&B NH", value: 0 },
      { domain: "ONDC:RET12", name: "Fashion H", value: 0 },
      { domain: "ONDC:RET12", name: "Fashion NH", value: 0 },
      { domain: "ONDC:RET13", name: "BPC H", value: 0 },
      { domain: "ONDC:RET13", name: "BPC NH", value: 0 },
      { domain: "ONDC:RET14", name: "Electronics H", value: 0 },
      { domain: "ONDC:RET14", name: "Electronics NH", value: 0 },
      { domain: "other", name: "other H", value: 0 },
      { domain: "other", name: "other NH", value: 0 },
    ];
  } else if (type === "forceCancellation") {
    return [
      { domain: "ONDC:RET10", name: "Grocery H", value: 0 },
      { domain: "ONDC:RET10", name: "Grocery NH", value: 0 },
      { domain: "ONDC:RET11", name: "F&B H", value: 0 },
      { domain: "ONDC:RET11", name: "F&B NH", value: 0 },
      { domain: "ONDC:RET12", name: "Fashion H", value: 0 },
      { domain: "ONDC:RET12", name: "Fashion NH", value: 0 },
      { domain: "ONDC:RET13", name: "BPC H", value: 0 },
      { domain: "ONDC:RET13", name: "BPC NH", value: 0 },
      { domain: "ONDC:RET14", name: "Electronics H", value: 0 },
      { domain: "ONDC:RET14", name: "Electronics NH", value: 0 },
      { domain: "other", name: "other H", value: 0 },
      { domain: "other", name: "other NH", value: 0 },
    ];
  } else if (type === "autoForceCancellation") {
    return [
      { domain: "ONDC:RET10", name: "Grocery H", value: 0 },
      { domain: "ONDC:RET10", name: "Grocery NH", value: 0 },
      { domain: "ONDC:RET11", name: "F&B H", value: 0 },
      { domain: "ONDC:RET11", name: "F&B NH", value: 0 },
      { domain: "ONDC:RET12", name: "Fashion H", value: 0 },
      { domain: "ONDC:RET12", name: "Fashion NH", value: 0 },
      { domain: "ONDC:RET13", name: "BPC H", value: 0 },
      { domain: "ONDC:RET13", name: "BPC NH", value: 0 },
      { domain: "ONDC:RET14", name: "Electronics H", value: 0 },
      { domain: "ONDC:RET14", name: "Electronics NH", value: 0 },
      { domain: "other", name: "other H", value: 0 },
      { domain: "other", name: "other NH", value: 0 },
    ];
  } else if (type === "calculateEtaTime") {
    return [
      { domain: "ONDC:RET10", name: "Grocery", value: 0 },
      { domain: "ONDC:RET11", name: "F&B", value: 0 },
      { domain: "ONDC:RET12", name: "Fashion", value: 0 },
      { domain: "ONDC:RET14", name: "Electronics", value: 0 },
      { domain: "other", name: "other", value: 0 },
    ];
  } else {
    return [{ domain: "any", name: "any", value: 0 }];
  }
};

export const cancellation = (actor, payload) => {
  const HL_CAP = 180 * 60 * 1000;

  const domain = payload?.domain;
  const items = payload?.confirmedItems;
  const orderCreatedTimestamp = new Date(payload?.createdAt).getTime();
  const currentTimestamp = Date.now();

  const deliveryFulfillment = (payload.fulfillments || []).find(
    (fulfillment) => fulfillment?.type === "Delivery"
  );

  if (!deliveryFulfillment || !deliveryFulfillment["@ondc/org/TAT"]) {
    return false;
  }

  if (notCancellableState.includes(deliveryFulfillment?.state?.descriptor?.code)) {
    return false;
  }

  const fulfillmentTAT = isoDurationToMilliseconds(
    deliveryFulfillment["@ondc/org/TAT"]
  );

  let promiseBuffer;
  switch (domain) {
    case "ONDC:RET10":
      // Grocery
      // promiseBuffer = 30 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET11":
      // F&B
      // promiseBuffer = 10 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET12":
      // Fashion
      // promiseBuffer = 30 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET13":
      // BPC
      // promiseBuffer = 30 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET14":
      // Electronics
      // promiseBuffer = 20 * 60 * 1000
      promiseBuffer = 0;
      break;
    default:
      // promiseBuffer = 10 * 60 * 1000
      promiseBuffer = 0;
  }

  const deliveryPromiseETA =
    orderCreatedTimestamp + fulfillmentTAT + promiseBuffer;

  const hyperlocalFlag = deliveryPromiseETA <= HL_CAP;

  const deliveryPromiseETABreach = currentTimestamp > deliveryPromiseETA;

  let CEB;
  switch (domain) {
    case "ONDC:RET10":
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
      break;
    case "ONDC:RET11":
      CEB = 0;
      break;
    case "ONDC:RET12":
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
      break;
    case "ONDC:RET13":
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
      break;
    case "ONDC:RET14":
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
      break;
    default:
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
  }

  const allItemsCancellable = items.every(
    (item) => item?.product?.["@ondc/org/cancellable"] === true
  );

  if (actor === "buyer") {
    if (domain === "ONDC:RET11") {
      return (
        allItemsCancellable && currentTimestamp >= orderCreatedTimestamp + CEB
      );
    } else if (hyperlocalFlag) {
      return (
        allItemsCancellable && currentTimestamp >= orderCreatedTimestamp + CEB
      );
    } else {
      if (allItemsCancellable) {
        return currentTimestamp >= orderCreatedTimestamp + CEB;
      } else if (deliveryPromiseETABreach) {
        return currentTimestamp >= deliveryPromiseETA + CEB;
      }
      return false;
    }
  } else if (actor === "agent" || actor === "opsLead") {
    if (domain === "ONDC:RET11") {
      if (allItemsCancellable) {
        return currentTimestamp >= orderCreatedTimestamp + CEB;
      } else if (deliveryPromiseETABreach) {
        return currentTimestamp >= deliveryPromiseETA + CEB;
      }
      return false;
    } else {
      if (allItemsCancellable) {
        return currentTimestamp >= orderCreatedTimestamp + CEB;
      } else if (deliveryPromiseETABreach) {
        return currentTimestamp >= deliveryPromiseETA + CEB;
      }
      return false;
    }
  }

  return false;
};

export const forceCancellation = (
  actor,
  payload,
  cancelTriggered,
  onCancelReceived,
  ttlExpired
) => {
  const HL_CAP = 180 * 60 * 1000;

  const domain = payload?.domain;
  const orderCreatedTimestamp = new Date(payload?.createdAt).getTime();
  const currentTimestamp = Date.now();

  const deliveryFulfillment = (payload.fulfillments || []).find(
    (fulfillment) => fulfillment?.type === "Delivery"
  );

  if (!deliveryFulfillment || !deliveryFulfillment["@ondc/org/TAT"]) {
    return false;
  }

  if (notCancellableState.includes(deliveryFulfillment?.state?.descriptor?.code)) {
    return false;
  }

  const fulfillmentTAT = isoDurationToMilliseconds(
    deliveryFulfillment["@ondc/org/TAT"]
  );

  let promiseBuffer;
  switch (domain) {
    case "ONDC:RET10":
      // Grocery
      // promiseBuffer = 30 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET11":
      // F&B
      // promiseBuffer = 10 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET12":
      // Fashion
      // promiseBuffer = 30 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET13":
      // BPC
      // promiseBuffer = 30 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET14":
      // Electronics
      // promiseBuffer = 20 * 60 * 1000
      promiseBuffer = 0;
      break;
    default:
      // promiseBuffer = 10 * 60 * 1000
      promiseBuffer = 0;
  }

  const deliveryPromiseETA =
    orderCreatedTimestamp + fulfillmentTAT + promiseBuffer;

  const hyperlocalFlag = deliveryPromiseETA <= HL_CAP;

  const deliveryPromiseETABreach = currentTimestamp > deliveryPromiseETA;

  let CEB;
  switch (domain) {
    case "ONDC:RET10":
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
      break;
    case "ONDC:RET11":
      CEB = 0;
      break;
    case "ONDC:RET12":
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
      break;
    case "ONDC:RET13":
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
      break;
    case "ONDC:RET14":
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
      break;
    default:
      CEB = hyperlocalFlag
        ? fulfillmentTAT
        : Math.min(0.5 * fulfillmentTAT, 2880 * 60 * 1000);
  }

  if (actor === "buyer") {
    return false;
  } else if (actor === "agent" || actor === "opsLead") {
    if (cancelTriggered && !onCancelReceived && !ttlExpired) {
      if (deliveryPromiseETABreach) {
        return currentTimestamp >= deliveryPromiseETA + CEB;
      }
      return false;
    }
    return false;
  }

  return false;
};

export const autoForceCancellation = (
  payload,
  cancelTriggered,
  onCancelReceived,
  ttlExpired
) => {
  const HL_CAP = 180 * 60 * 1000;

  const domain = payload?.domain;
  const orderCreatedTimestamp = new Date(payload?.createdAt).getTime();
  const currentTimestamp = Date.now();

  const deliveryFulfillment = (payload.fulfillments || []).find(
    (fulfillment) => fulfillment?.type === "Delivery"
  );

  if (!deliveryFulfillment || !deliveryFulfillment["@ondc/org/TAT"]) {
    return false;
  }

  if (notCancellableState.includes(deliveryFulfillment?.state?.descriptor?.code)) {
    return false;
  }

  const fulfillmentTAT = isoDurationToMilliseconds(
    deliveryFulfillment["@ondc/org/TAT"]
  );

  let promiseBuffer;
  switch (domain) {
    case "ONDC:RET10":
      // Grocery
      // promiseBuffer = 30 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET11":
      // F&B
      // promiseBuffer = 10 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET12":
      // Fashion
      // promiseBuffer = 30 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET13":
      // BPC
      // promiseBuffer = 30 * 60 * 1000
      promiseBuffer = 0;
      break;
    case "ONDC:RET14":
      // Electronics
      // promiseBuffer = 20 * 60 * 1000
      promiseBuffer = 0;
      break;
    default:
      // promiseBuffer = 10 * 60 * 1000
      promiseBuffer = 0;
  }

  const deliveryPromiseETA =
    orderCreatedTimestamp + fulfillmentTAT + promiseBuffer;

  const hyperlocalFlag = deliveryPromiseETA <= HL_CAP;

  const deliveryPromiseETABreach = currentTimestamp > deliveryPromiseETA;

  let ATB;
  switch (domain) {
    case "ONDC:RET10":
      ATB = hyperlocalFlag
        ? Math.min(fulfillmentTAT, 720 * 60 * 1000)
        : Math.min(0.5 * fulfillmentTAT, 10080 * 60 * 1000);
      break;
    case "ONDC:RET11":
      ATB = 120 * 60 * 1000;
      break;
    case "ONDC:RET12":
      ATB = hyperlocalFlag
        ? Math.min(fulfillmentTAT, 720 * 60 * 1000)
        : Math.min(0.5 * fulfillmentTAT, 10080 * 60 * 1000);
      break;
    case "ONDC:RET13":
      ATB = hyperlocalFlag
        ? Math.min(fulfillmentTAT, 720 * 60 * 1000)
        : Math.min(0.5 * fulfillmentTAT, 10080 * 60 * 1000);
      break;
    case "ONDC:RET14":
      ATB = hyperlocalFlag
        ? Math.min(fulfillmentTAT, 720 * 60 * 1000)
        : Math.min(0.5 * fulfillmentTAT, 10080 * 60 * 1000);
      break;
    default:
      ATB = hyperlocalFlag
        ? Math.min(fulfillmentTAT, 720 * 60 * 1000)
        : Math.min(0.5 * fulfillmentTAT, 10080 * 60 * 1000);
  }

  if (
    cancelTriggered &&
    !onCancelReceived &&
    !ttlExpired &&
    deliveryPromiseETABreach
  ) {
    return currentTimestamp >= deliveryPromiseETA + ATB;
  }

  return false;
};
