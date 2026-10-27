import {
  endpoint,
  receive,
  respond,
} from "@mit-sdg/sync-engine/boundary";

import {
  each,
  former,
  where,
} from "@mit-sdg/sync-engine/language";

import { concepts } from "../concepts.ts";

import {
  SharedIntentions,
} from "./WeShould.ts";

import {
  connectionIdInput,
  connectionRequestInput,
  homeInput,
  homeOutput,
  intentionInput,
  planIdInput,
  planProposalInput,
  planResponseInput,
  requestIdInput,
  simpleIdOutput,
} from "./validators.ts";

const {
  Sessioning,
  Resolving,
  Intending,
  Connecting,
  Planning,
} = concepts;

const Home =
  former(
    "the home state for (user)",
    (
      {
        user,
      },
      {
        connection,
        peer,

        request,
        requester,

        intention,
        intentionItem,
        intentionName,
        intentionReference,

        sharedPeer,
        sharedItem,
        sharedName,
        sharedReference,

        plan,
        planItem,
        planName,
        planReference,
        planOrganizer,
        planParticipants,
        planResponse,
        time,
        status,
      },
    ) =>
      where().form({
        connections:
          each(
            Connecting._connections({
              user,
            }).is({
              connection,
              peer,
            }),
          ).form({
            connection,
            peer,
          }),

        pendingRequests:
          each(
            Connecting._pendingFor({
              recipient:
                user,
            }).is({
              request,
              requester,
            }),
          ).form({
            request,
            requester,
          }),

        intentions:
          each(
            Intending._byUser({
              user,
            }).is({
              intention,
              item:
                intentionItem,
            }),
          )
            .where(
              Resolving._get({
                item:
                  intentionItem,
              }).is({
                name:
                  intentionName,

                reference:
                  intentionReference,
              }),
            )
            .form({
              intention,

              item:
                intentionItem,

              name:
                intentionName,

              reference:
                intentionReference,
            }),

        sharedIntentions:
          each(
            SharedIntentions({
              user,
            }).is({
              peer:
                sharedPeer,

              item:
                sharedItem,
            }),
          )
            .where(
              Resolving._get({
                item:
                  sharedItem,
              }).is({
                name:
                  sharedName,

                reference:
                  sharedReference,
              }),
            )
            .form({
              peer:
                sharedPeer,

              item:
                sharedItem,

              name:
                sharedName,

              reference:
                sharedReference,
            }),

        plans:
          each(
            Planning._forUser({
              user,
            }).is({
              plan,

              item:
                planItem,

              time,
              status,
            }),
          )
            .where(
              Planning._get({
                plan,
              }).is({
                organizer:
                  planOrganizer,
                participants:
                  planParticipants,
              }),

              Planning._responses({
                plan,
              }).is({
                user,

                response:
                  planResponse,
              }),

              Resolving._get({
                item:
                  planItem,
              }).is({
                name:
                  planName,

                reference:
                  planReference,
              }),
            )
            .form({
              plan,

              item:
                planItem,

              name:
                planName,

              reference:
                planReference,

              organizer:
                planOrganizer,

              participants:
                planParticipants,

              response:
                planResponse,

              time,
              status,
            }),
      }),
  );

/* ---------- Connections ---------- */

const RequestConnection =
  endpoint(
    "/connections/request",
    ({
      session,
      recipient,
      requester,
      request,
    }) =>
      receive({
        session,
        recipient,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject:
              requester,
          }),
        )
        .then(
          Connecting.request({
            requester,
            recipient,
          }).responds({
            request,
          }),
        )
        .then(
          respond({
            id: request,
          }),
        ),
    {
      input: {
        required: [
          "session",
          "recipient",
        ],
      },

      validators: {
        input:
          connectionRequestInput,

        output:
          simpleIdOutput,
      },
    },
  );

const AcceptConnection =
  endpoint(
    "/connections/accept",
    ({
      session,
      request,
      recipient,
      connection,
    }) =>
      receive({
        session,
        request,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject:
              recipient,
          }),
        )
        .then(
          Connecting.accept({
            recipient,
            request,
          }).responds({
            connection,
          }),
        )
        .then(
          respond({
            id:
              connection,
          }),
        ),
    {
      input: {
        required: [
          "session",
          "request",
        ],
      },

      validators: {
        input:
          requestIdInput,

        output:
          simpleIdOutput,
      },
    },
  );

const DeclineConnection =
  endpoint(
    "/connections/decline",
    ({
      session,
      request,
      recipient,
      declinedRequest,
    }) =>
      receive({
        session,
        request,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject:
              recipient,
          }),
        )
        .then(
          Connecting.decline({
            recipient,
            request,
          }).responds({
            request:
              declinedRequest,
          }),
        )
        .then(
          respond({
            id:
              declinedRequest,
          }),
        ),
    {
      input: {
        required: [
          "session",
          "request",
        ],
      },

      validators: {
        input:
          requestIdInput,

        output:
          simpleIdOutput,
      },
    },
  );

const Disconnect =
  endpoint(
    "/connections/disconnect",
    ({
      session,
      connection,
      user,
      disconnected,
    }) =>
      receive({
        session,
        connection,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject: user,
          }),
        )
        .then(
          Connecting.disconnect({
            user,
            connection,
          }).responds({
            connection:
              disconnected,
          }),
        )
        .then(
          respond({
            id:
              disconnected,
          }),
        ),
    {
      input: {
        required: [
          "session",
          "connection",
        ],
      },

      validators: {
        input:
          connectionIdInput,

        output:
          simpleIdOutput,
      },
    },
  );

/* ---------- Intentions ---------- */

const ExpressIntention =
  endpoint(
    "/intentions/express",
    ({
      session,
      name,
      reference,
      user,
      item,
      describedItem,
      intention,
    }) =>
      receive({
        session,
        name,
        reference,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject: user,
          }),
        )
        .then(
          Resolving.resolve({
            reference,
          }).responds({
            item,
          }),
        )
        .then(
          Resolving.describe({
            item,
            name,
            reference,
          }).responds({
            resolved:
              describedItem,
          }),
        )
        .then(
          Intending.express({
            user,

            item:
              describedItem,
          }).responds({
            intention,
          }),
        )
        .then(
          respond({
            id:
              intention,
          }),
        ),
    {
      input: {
        required: [
          "session",
          "name",
          "reference",
        ],
      },

      validators: {
        input:
          intentionInput,

        output:
          simpleIdOutput,
      },
    },
  );

/* ---------- Planning ---------- */

const ProposePlan =
  endpoint(
    "/plans/propose",
    ({
      session,
      item,
      participants,
      time,
      organizer,
      plan,
    }) =>
      receive({
        session,
        item,
        participants,
        time,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject:
              organizer,
          }),
        )
        .then(
          Planning.propose({
            organizer,
            item,
            participants,
            time,
          }).responds({
            plan,
          }),
        )
        .then(
          respond({
            id: plan,
          }),
        ),
    {
      input: {
        required: [
          "session",
          "item",
          "participants",
          "time",
        ],
      },

      validators: {
        input:
          planProposalInput,

        output:
          simpleIdOutput,
      },
    },
  );

const RespondToPlan =
  endpoint(
    "/plans/respond",
    ({
      session,
      plan,
      response,
      user,
    }) =>
      receive({
        session,
        plan,
        response,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject: user,
          }),
        )
        .then(
          Planning.respond({
            user,
            plan,
            response,
          }).responds({}),
        )
        .then(
          respond({
            id: plan,
          }),
        ),
    {
      input: {
        required: [
          "session",
          "plan",
          "response",
        ],
      },

      validators: {
        input:
          planResponseInput,

        output:
          simpleIdOutput,
      },
    },
  );

const CancelPlan =
  endpoint(
    "/plans/cancel",
    ({
      session,
      plan,
      user,
    }) =>
      receive({
        session,
        plan,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject: user,
          }),
        )
        .then(
          Planning.cancel({
            user,
            plan,
          }).responds({}),
        )
        .then(
          respond({
            id: plan,
          }),
        ),
    {
      input: {
        required: [
          "session",
          "plan",
        ],
      },

      validators: {
        input:
          planIdInput,

        output:
          simpleIdOutput,
      },
    },
  );

const CompletePlan =
  endpoint(
    "/plans/complete",
    ({
      session,
      plan,
      user,
    }) =>
      receive({
        session,
        plan,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject: user,
          }),
        )
        .then(
          Planning.complete({
            plan,
            user,
          }).responds({}),
        )
        .then(
          respond({
            id: plan,
          }),
        ),
    {
      input: {
        required: [
          "session",
          "plan",
        ],
      },

      validators: {
        input:
          planIdInput,

        output:
          simpleIdOutput,
      },
    },
  );

/* ---------- Reads ---------- */

const GetHome =
  endpoint(
    "/home",
    ({
      session,
      user,
    }) =>
      receive({
        session,
      })
        .then(
          Sessioning.current({
            session,
          }).responds({
            subject: user,
          }),
        )
        .then(
          respond({
            home:
              Home({
                user,
              }),
          }),
        ),
    {
      input: {
        required: [
          "session",
        ],
      },

      validators: {
        input:
          homeInput,

        output:
          homeOutput,
      },
    },
  );

export const composition = {
  Connections: {
    RequestConnection,
    AcceptConnection,
    DeclineConnection,
    Disconnect,
  },

  Intentions: {
    ExpressIntention,
  },

  Plans: {
    ProposePlan,
    RespondToPlan,
    CancelPlan,
    CompletePlan,
  },

  Home: {
    GetHome,
    Home,
  },
};