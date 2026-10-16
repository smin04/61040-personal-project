import {
  reaction,
  view,
  when,
  where,
} from "@mit-sdg/sync-engine/language";

import { concepts } from "../concepts.ts";

const {
  Connecting,
  Intending,
  Planning,
} = concepts;

export const SharedIntentions =
  view(
    "shared intentions for (user)",
    (
      {
        user,
      },
      {
        peer,
        item,
      },
      _bindings,
    ) =>
      where(
        Connecting._connections({
          user,
        }).is({
          peer,
        }),

        Intending._byUser({
          user,
        }).is({
          item,
        }),

        Intending._has({
          user: peer,
          item,
        }).is({
          active: true,
        }),
      ),
  ).many();

const AcceptanceCommitsPlan =
  reaction(
    ({
      plan,
    }) =>
      when(
        Planning.respond({
          plan,
          response:
            "ACCEPTED",
        }).responds({}),
      )
        .where(
          Planning._allAccepted({
            plan,
          }).is({
            accepted: true,
          }),
        )
        .then(
          Planning.commit({
            plan,
          }),
        ),
  );

const CompletionWithdrawsIntentions =
  reaction(
    ({
      plan,
      item,
      user,
      intention,
    }) =>
      when(
        Planning.complete({
          plan,
        }).responds({}),
      )
        .where(
          Planning._get({
            plan,
          }).is({
            item,
          }),

          Planning._responses({
            plan,
          }).is({
            user,
          }),

          Intending._has({
            user,
            item,
          }).is({
            active: true,
          }),

          Intending._byUser({
            user,
          }).is({
            intention,
            item,
          }),
        )
        .then(
          Intending.withdraw({
            intention,
          }),
        ),
  );

export const composition = {
  SharedIntentions: {
    SharedIntentions,
  },

  Planning: {
    AcceptanceCommitsPlan,
    CompletionWithdrawsIntentions,
  },
};