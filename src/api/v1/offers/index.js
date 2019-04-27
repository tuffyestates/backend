import eeClient from "elasticemail-webapiclient";
import Logger from "../../../logger";
import Joi from "joi";
import {HTTPError} from "ayyo";

import DB from "../../../database";

export const components = {};
components.email = Joi.string().example("JohnDoe@gmail.com");
components.name = Joi.string().example("John Doe");
components.phone = Joi.string().example("7773331234");
components.homeOffer = Joi.string()
  .hex()
  .length(24)
  .example("5bd3ddfdf20ff91132255496")
  .meta({ type: "ObjectId" });
components.cashOffer = Joi.integer()
  .positive()
  .example("200000");
components.comments = Joi.string().example("A pool table");

export const handlers = {};
handlers.email = async function({ req, res }) {
  // Connect to DB
  const database = await DB();

  const property = await database.models.property.findOne(
    {
      _id: req.body.tradeOffer
    },
    { __v: 0 }
  );
  // If the property wasn't found inform the user
  if (!property) {
    throw new HTTPError(400, "Property not found");
  }

  // Email client credentials
  const options = {
    apiKey: "b096ebb6-97f8-4b24-b669-686c9641198e",
    apiUri: "https://api.elasticemail.com/",
    apiVersion: "v2"
  };

  const EE = new eeClient(options);

  // Load account data
  const response = await EE.Account.Load();
  Logger.debug(response);
  Logger.debug(req.jwd.email);

  // Email data
  const emailParams = {
    subject: "Tuffy Estates - You got an offer for your home",
    to: req.body.email,
    from: "tuffyestates@gmail.com",
    replyTo: req.jwd.email,
    body: `Name: ${req.body.name}
    Email: ${req.body.phone}
    Phone: ${req.body.phone}
    Trade Home: ${property.address}
    Cash Offer: ${req.body.cashOffer}
    Comments: ${req.body.comments}`,
    fromName: "Tuffy Estates",
    bodyType: "Plain"
  };

  // Send email
  await EE.Email.Send(emailParams);
};

export const routes = {
  "email/POST": {
    handler: handlers.email,
    openapi: {
      description: "Email",
      schema: {
        consumes: {
          body: Joi.object({
            email: components.email.required(),
            name: components.name.required(),
            phone: components.phone.required(),
            tradeOffer: components.tradeOffer.required(),
            cashOffer: components.cashOffer,
            comments: components.comments
          })
        },
        produces: {
          204: {
            description: "Email Information Accepted"
          }
        }
      }
    }
  }
};
