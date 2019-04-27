import {client as eeClient} from "elasticemail-webapiclient";
import Logger from "../../../logger";
import Joi from "joi";
import {HTTPError} from "ayyo";

import DB from "../../../database";

export const components = {};
components.name = Joi.string().example("John Doe");
components.phone = Joi.string().example("7773331234");
components.homeOffer = Joi.string()
  .hex()
  .length(24)
  .example("5c02e61ae9383d4866fbe92e")
  .meta({ type: "ObjectId" });
components.cashOffer = Joi.number().integer()
  .positive()
  .example(200000);
components.comments = Joi.string()
  .example("A pool table");

export const handlers = {};
handlers.email = async function({ req, res }) {
  // Connect to DB
  const database = await DB();

  const property = await database.models.property.findOne(
    {
      _id: req.body.homeOffer
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
  Logger.debug(req.jwt.email);

  // Email data
  const emailParams = {
    subject: "You got an offer for your home",
    to: "tuffyestates@gmail.com",
    from: "tuffyestates@gmail.com",
    replyTo: req.jwt.email,
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
      security: [{JsonWebToken: []}],
      schema: {
        consumes: {
          body: Joi.object({
            name: components.name.required(),
            phone: components.phone.required(),
            homeOffer: components.homeOffer.required(),
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
