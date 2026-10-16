import type { Collection, Db } from "mongodb";

export class OrganizerNotParticipant extends Error {}
export class TooFewParticipants extends Error {}
export class PlanNotFound extends Error {}
export class PlanNotProposed extends Error {}
export class NotParticipant extends Error {}
export class InvalidResponse extends Error {}
export class NotAllAccepted extends Error {}
export class PlanClosed extends Error {}
export class PlanNotCommitted extends Error {}

type Response = "PENDING" | "ACCEPTED" | "DECLINED";

type Status =
  | "PROPOSED"
  | "COMMITTED"
  | "CANCELLED"
  | "COMPLETED";

type PlanDocument = {
  plan: string;
  organizer: string;
  item: string;
  time: string;
  participants: string[];
  status: Status;
};

type ResponseDocument = {
  plan: string;
  user: string;
  response: Response;
};

export class PlanningConcept {
  private readonly plans: Collection<PlanDocument>;
  private readonly responses: Collection<ResponseDocument>;
  private ready: Promise<unknown> | undefined;

  constructor(
    db: Db,
    namespace = "Planning",
    private readonly freshID: () => string = () => crypto.randomUUID(),
  ) {
    this.plans = db.collection<PlanDocument>(
      `${namespace}.plans`,
    );

    this.responses = db.collection<ResponseDocument>(
      `${namespace}.responses`,
    );
  }

  async propose({
    organizer,
    item,
    participants,
    time,
  }: {
    organizer: string;
    item: string;
    participants: string[];
    time: string;
  }): Promise<{ plan: string }> {
    this.ready ??= Promise.all([
      this.responses.createIndex(
        { plan: 1, user: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const uniqueParticipants = [...new Set(participants)];

    if (!uniqueParticipants.includes(organizer)) {
      throw new OrganizerNotParticipant(
        "The organizer must be included among the participants.",
      );
    }

    if (uniqueParticipants.length < 2) {
      throw new TooFewParticipants(
        "A plan must have at least two participants.",
      );
    }

    const plan = this.freshID();

    await this.plans.insertOne({
      plan,
      organizer,
      item,
      time,
      participants: uniqueParticipants,
      status: "PROPOSED",
    });

    try {
      await this.responses.insertMany(
        uniqueParticipants.map((user) => ({
          plan,
          user,
          response:
            user === organizer
              ? "ACCEPTED"
              : "PENDING",
        })),
      );
    } catch (error) {
      await this.responses.deleteMany({ plan });
      await this.plans.deleteOne({ plan });
      throw error;
    }

    return { plan };
  }

  async respond({
    user,
    plan,
    response,
  }: {
    user: string;
    plan: string;
    response: Response;
  }): Promise<Record<string, never>> {
    this.ready ??= Promise.all([
      this.responses.createIndex(
        { plan: 1, user: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const foundPlan = await this.plans.findOne({
      plan,
    });

    if (foundPlan === null) {
      throw new PlanNotFound(
        "There is no such plan.",
      );
    }

    if (foundPlan.status !== "PROPOSED") {
      throw new PlanNotProposed(
        "Responses may only be changed while a plan is proposed.",
      );
    }

    if (!foundPlan.participants.includes(user)) {
      throw new NotParticipant(
        "Only a participant may respond to this plan.",
      );
    }

    if (response === "PENDING") {
      throw new InvalidResponse(
        "A participant response must be accepted or declined.",
      );
    }

    await this.responses.updateOne(
      {
        plan,
        user,
      },
      {
        $set: {
          response,
        },
      },
    );

    return {};
  }

  async commit({
    plan,
  }: {
    plan: string;
  }): Promise<Record<string, never>> {
    this.ready ??= Promise.all([
      this.responses.createIndex(
        { plan: 1, user: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const foundPlan = await this.plans.findOne({
      plan,
    });

    if (foundPlan === null) {
      throw new PlanNotFound(
        "There is no such plan.",
      );
    }

    if (foundPlan.status !== "PROPOSED") {
      throw new PlanNotProposed(
        "Only a proposed plan may become committed.",
      );
    }

    const nonAccepted = await this.responses.findOne({
      plan,
      response: {
        $ne: "ACCEPTED",
      },
    });

    if (nonAccepted !== null) {
      throw new NotAllAccepted(
        "Every participant must accept before the plan can be committed.",
      );
    }

    await this.plans.updateOne(
      { plan },
      {
        $set: {
          status: "COMMITTED",
        },
      },
    );

    return {};
  }

  async cancel({
    user,
    plan,
  }: {
    user: string;
    plan: string;
  }): Promise<Record<string, never>> {
    this.ready ??= Promise.all([
      this.responses.createIndex(
        { plan: 1, user: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const foundPlan = await this.plans.findOne({
      plan,
    });

    if (foundPlan === null) {
      throw new PlanNotFound(
        "There is no such plan.",
      );
    }

    if (!foundPlan.participants.includes(user)) {
      throw new NotParticipant(
        "Only a participant may cancel this plan.",
      );
    }

    if (
      foundPlan.status === "CANCELLED" ||
      foundPlan.status === "COMPLETED"
    ) {
      throw new PlanClosed(
        "A cancelled or completed plan cannot be cancelled again.",
      );
    }

    await this.plans.updateOne(
      { plan },
      {
        $set: {
          status: "CANCELLED",
        },
      },
    );

    return {};
  }

  async complete({
    plan,
  }: {
    plan: string;
  }): Promise<Record<string, never>> {
    this.ready ??= Promise.all([
      this.responses.createIndex(
        { plan: 1, user: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const foundPlan = await this.plans.findOne({
      plan,
    });

    if (foundPlan === null) {
      throw new PlanNotFound(
        "There is no such plan.",
      );
    }

    if (foundPlan.status !== "COMMITTED") {
      throw new PlanNotCommitted(
        "Only a committed plan may be completed.",
      );
    }

    await this.plans.updateOne(
      { plan },
      {
        $set: {
          status: "COMPLETED",
        },
      },
    );

    return {};
  }

  async _get({
    plan,
  }: {
    plan: string;
  }): Promise<
    {
      organizer: string;
      item: string;
      time: string;
      participants: string[];
      status: Status;
    }[]
  > {
    this.ready ??= Promise.all([
      this.responses.createIndex(
        { plan: 1, user: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const found = await this.plans.findOne({
      plan,
    });

    if (found === null) {
      return [];
    }

    return [
      {
        organizer: found.organizer,
        item: found.item,
        time: found.time,
        participants: found.participants,
        status: found.status,
      },
    ];
  }

  async _responses({
    plan,
  }: {
    plan: string;
  }): Promise<{ user: string; response: Response }[]> {
    this.ready ??= Promise.all([
      this.responses.createIndex(
        { plan: 1, user: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const rows = await this.responses
      .find({ plan })
      .sort({ user: 1 })
      .toArray();

    return rows.map(({ user, response }) => ({
      user,
      response,
    }));
  }

  async _forUser({
    user,
  }: {
    user: string;
  }): Promise<
    {
      plan: string;
      item: string;
      time: string;
      status: Status;
    }[]
  > {
    this.ready ??= Promise.all([
      this.responses.createIndex(
        { plan: 1, user: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const rows = await this.plans
      .find({
        participants: user,
      })
      .sort({ plan: 1 })
      .toArray();

    return rows.map((row) => ({
      plan: row.plan,
      item: row.item,
      time: row.time,
      status: row.status,
    }));
  }

  async _allAccepted({
    plan,
  }: {
    plan: string;
  }): Promise<{ accepted: boolean }> {
    this.ready ??= Promise.all([
      this.responses.createIndex(
        { plan: 1, user: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const foundPlan = await this.plans.findOne({
      plan,
    });

    if (foundPlan === null) {
      return {
        accepted: false,
      };
    }

    const nonAccepted = await this.responses.findOne({
      plan,
      response: {
        $ne: "ACCEPTED",
      },
    });

    return {
      accepted: nonAccepted === null,
    };
  }
}