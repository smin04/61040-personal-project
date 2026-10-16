import {
  createApp,
  onMounted,
  onUnmounted,
  ref,
} from "vue/dist/vue.esm-bundler.js";

interface Connection {
  connection: string;
  peer: string;
}

interface PendingRequest {
  request: string;
  requester: string;
}

interface Intention {
  intention: string;
  item: string;
  name: string;
  reference: string;
}

interface SharedIntention {
  peer: string;
  item: string;
  name: string;
  reference: string;
}

type PlanResponse =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED";

interface Plan {
  plan: string;
  item: string;
  name: string;
  reference: string;
  organizer: string;
  response: PlanResponse;
  time: string;
  status:
    | "PROPOSED"
    | "COMMITTED"
    | "CANCELLED"
    | "COMPLETED";
}

interface Home {
  connections: Connection[];
  pendingRequests: PendingRequest[];
  intentions: Intention[];
  sharedIntentions: SharedIntention[];
  plans: Plan[];
}

let session =
  sessionStorage.getItem(
    "weshould-session",
  );

async function api(
  path: string,
  body: Record<string, unknown> = {},
): Promise<any> {
  const isPublicAuth =
    path === "/auth/register" ||
    path === "/auth/sign-in";

  const requestBody =
    !isPublicAuth && session
      ? {
          ...body,
          session,
        }
      : body;

  const response =
    await fetch(
      `/api${path}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          requestBody,
        ),
      },
    );

  const result =
    (await response.json()) as Record<
      string,
      unknown
    >;

  if (!response.ok) {
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : "Something went wrong.",
    );
  }

  return result;
}

const app = createApp({
  setup() {
    const username = ref("");
    const password = ref("");

    const signedInUser =
      ref<string | null>(null);

    const error = ref("");
    const loading = ref(false);

    const connectionUsername =
      ref("");

    const activityName = ref("");
    const activityUrl = ref("");

    const selectedPlanItem =
      ref("");

    const selectedPlanName =
      ref("");

    const selectedPlanPeer =
      ref("");

    const planTime = ref("");

    const home =
      ref<Home | null>(null);

    let refreshTimer:
      number | undefined;

    async function run(
      action: () => Promise<void>,
    ) {
      error.value = "";
      loading.value = true;

      try {
        await action();
        error.value = "";
      } catch (caught) {
        error.value =
          caught instanceof Error
            ? caught.message
            : "Something went wrong.";
      } finally {
        loading.value = false;
      }
    }

    async function loadHome() {
      if (!session) {
        return;
      }

      const result =
        await api("/home");

      home.value =
        result.home as Home;
    }

    async function quietRefresh() {
      if (
        !session ||
        !signedInUser.value ||
        loading.value
      ) {
        return;
      }

      try {
        await loadHome();
      } catch {
        // Explicit user actions surface errors.
      }
    }

    async function currentUser() {
      if (!session) {
        signedInUser.value = null;
        home.value = null;
        return;
      }

      try {
        const result =
          await api(
            "/auth/current",
          );

        signedInUser.value =
          result.username;

        await loadHome();
      } catch {
        session = null;

        sessionStorage.removeItem(
          "weshould-session",
        );

        signedInUser.value = null;
        home.value = null;
      }
    }

    async function register() {
      await run(async () => {
        const result =
          await api(
            "/auth/register",
            {
              username:
                username.value,

              password:
                password.value,
            },
          );

        session =
          result.session;

        sessionStorage.setItem(
          "weshould-session",
          session!,
        );

        signedInUser.value =
          result.account;

        password.value = "";

        await loadHome();
      });
    }

    async function signIn() {
      await run(async () => {
        const result =
          await api(
            "/auth/sign-in",
            {
              username:
                username.value,

              password:
                password.value,
            },
          );

        session =
          result.session;

        sessionStorage.setItem(
          "weshould-session",
          session!,
        );

        signedInUser.value =
          result.account;

        password.value = "";

        await loadHome();
      });
    }

    async function signOut() {
      await run(async () => {
        if (session) {
          await api(
            "/auth/sign-out",
          );
        }

        session = null;

        sessionStorage.removeItem(
          "weshould-session",
        );

        signedInUser.value = null;
        home.value = null;
      });
    }

    async function requestConnection() {
      await run(async () => {
        await api(
          "/connections/request",
          {
            recipient:
              connectionUsername.value,
          },
        );

        connectionUsername.value =
          "";

        await loadHome();
      });
    }

    async function acceptConnection(
      request: string,
    ) {
      await run(async () => {
        await api(
          "/connections/accept",
          {
            request,
          },
        );

        await loadHome();
      });
    }

    async function declineConnection(
      request: string,
    ) {
      await run(async () => {
        await api(
          "/connections/decline",
          {
            request,
          },
        );

        await loadHome();
      });
    }

    async function disconnect(
      connection: string,
    ) {
      await run(async () => {
        await api(
          "/connections/disconnect",
          {
            connection,
          },
        );

        await loadHome();
      });
    }

    async function expressIntention() {
      await run(async () => {
        await api(
          "/intentions/express",
          {
            name:
              activityName.value,

            reference:
              activityUrl.value,
          },
        );

        activityName.value = "";
        activityUrl.value = "";

        await loadHome();
      });
    }

    function choosePlan(
      shared: SharedIntention,
    ) {
      selectedPlanItem.value =
        shared.item;

      selectedPlanName.value =
        shared.name;

      selectedPlanPeer.value =
        shared.peer;

      planTime.value = "";

      window.requestAnimationFrame(
        () => {
          document
            .getElementById(
              "plan-composer",
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        },
      );
    }

    function clearPlanDraft() {
      selectedPlanItem.value = "";
      selectedPlanName.value = "";
      selectedPlanPeer.value = "";
      planTime.value = "";
    }

    async function proposePlan() {
      await run(async () => {
        if (
          !signedInUser.value ||
          !selectedPlanItem.value ||
          !selectedPlanPeer.value
        ) {
          throw new Error(
            "Choose a shared activity first.",
          );
        }

        await api(
          "/plans/propose",
          {
            item:
              selectedPlanItem.value,

            participants: [
              signedInUser.value,
              selectedPlanPeer.value,
            ],

            time:
              planTime.value,
          },
        );

        clearPlanDraft();

        await loadHome();
      });
    }

    async function respondToPlan(
      plan: string,
      response:
        | "ACCEPTED"
        | "DECLINED",
    ) {
      await run(async () => {
        await api(
          "/plans/respond",
          {
            plan,
            response,
          },
        );

        await loadHome();
      });
    }

    async function cancelPlan(
      plan: string,
    ) {
      await run(async () => {
        await api(
          "/plans/cancel",
          {
            plan,
          },
        );

        await loadHome();
      });
    }

    async function completePlan(
      plan: string,
    ) {
      await run(async () => {
        await api(
          "/plans/complete",
          {
            plan,
          },
        );

        await loadHome();
      });
    }

    function displayReference(
      reference: string,
    ): string {
      try {
        const url =
          new URL(reference);

        const path =
          url.pathname === "/"
            ? ""
            : url.pathname;

        return `${url.hostname}${path}`;
      } catch {
        return reference;
      }
    }

    function prettyStatus(
      status: Plan["status"],
    ): string {
      switch (status) {
        case "PROPOSED":
          return "Waiting";
        case "COMMITTED":
          return "It's on";
        case "COMPLETED":
          return "Done";
        case "CANCELLED":
          return "Cancelled";
      }
    }

    onMounted(() => {
      void currentUser();

      refreshTimer =
        window.setInterval(
          () => {
            void quietRefresh();
          },
          1500,
        );
    });

    onUnmounted(() => {
      if (
        refreshTimer !==
        undefined
      ) {
        window.clearInterval(
          refreshTimer,
        );
      }
    });

    return {
      username,
      password,

      signedInUser,

      error,
      loading,

      connectionUsername,

      activityName,
      activityUrl,

      selectedPlanItem,
      selectedPlanName,
      selectedPlanPeer,
      planTime,

      home,

      register,
      signIn,
      signOut,

      requestConnection,
      acceptConnection,
      declineConnection,
      disconnect,

      expressIntention,

      choosePlan,
      clearPlanDraft,
      proposePlan,

      respondToPlan,
      cancelPlan,
      completePlan,

      displayReference,
      prettyStatus,
    };
  },

  template: `
    <main class="page">
      <header class="topbar">
        <div class="identity">
          <div class="logo-mark">
            W
          </div>

          <div>
            <div class="brand">
              WeShould
            </div>

            <div class="tagline">
              Turn “we should” into something you actually do.
            </div>
          </div>
        </div>

        <div
          v-if="signedInUser"
          class="signed-in"
        >
          <span class="username-pill">
            @{{ signedInUser }}
          </span>

          <button
            class="button ghost-button"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </header>

      <div
        v-if="error"
        class="error"
      >
        <span class="error-dot"></span>

        {{ error }}
      </div>

      <section
        v-if="!signedInUser"
        class="auth-shell"
      >
        <div class="auth-card">
          <div class="eyebrow">
            Make the plan happen
          </div>

          <h1 class="auth-title">
            Stop losing the things
            you said you'd do.
          </h1>

          <p class="auth-copy">
            Save places and activities while the idea is still fresh.
            When a friend independently wants the same thing,
            WeShould turns that overlap into an actual plan.
          </p>

          <div class="auth-fields">
            <label>
              Username

              <input
                v-model="username"
                placeholder="josie"
                autocomplete="username"
              />
            </label>

            <label>
              Password

              <input
                v-model="password"
                type="password"
                placeholder="Password"
                autocomplete="current-password"
              />
            </label>
          </div>

          <div class="auth-actions">
            <button
              class="button primary-button"
              :disabled="loading"
              @click="signIn"
            >
              Sign in
            </button>

            <button
              class="button secondary-button"
              :disabled="loading"
              @click="register"
            >
              Create account
            </button>
          </div>
        </div>
      </section>

      <template v-else>
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow">
              Your someday list, with a way forward
            </div>

            <h1>
              What would you
              actually go do?
            </h1>

            <p class="hero-subtitle">
              Save the idea now. Figure out the logistics only
              when someone else is in too.
            </p>
          </div>

          <div class="activity-form">
            <div class="activity-form-heading">
              Add something you'd go to
            </div>

            <input
              v-model="activityName"
              placeholder="Wally's Cafe"
            />

            <div class="activity-url-row">
              <input
                v-model="activityUrl"
                placeholder="Paste a link"
                @keyup.enter="expressIntention"
              />

              <button
                class="button primary-button save-button"
                :disabled="
                  loading ||
                  !activityName.trim() ||
                  !activityUrl.trim()
                "
                @click="expressIntention"
              >
                I'd Go
              </button>
            </div>

            <div class="form-note">
              No date. No invitation. Just remember the intention.
            </div>
          </div>
        </section>

        <section class="summary-strip">
          <div class="summary-item">
            <span class="summary-number">
              {{ home?.intentions?.length || 0 }}
            </span>

            <span class="summary-label">
              things you'd go to
            </span>
          </div>

          <div class="summary-divider"></div>

          <div class="summary-item">
            <span class="summary-number">
              {{ home?.sharedIntentions?.length || 0 }}
            </span>

            <span class="summary-label">
              shared ideas
            </span>
          </div>

          <div class="summary-divider"></div>

          <div class="summary-item">
            <span class="summary-number">
              {{ home?.connections?.length || 0 }}
            </span>

            <span class="summary-label">
              connections
            </span>
          </div>
        </section>

        <div class="grid">
          <section class="card shared-card">
            <div class="section-heading">
              <div>
                <div class="eyebrow accent-eyebrow">
                  The interesting part
                </div>

                <h2>
                  You'd both go
                </h2>

                <p class="section-description">
                  You saved these independently. That's enough of
                  a reason to make something happen.
                </p>
              </div>

              <span class="count">
                {{ home?.sharedIntentions?.length || 0 }}
              </span>
            </div>

            <div
              v-if="!home?.sharedIntentions?.length"
              class="empty-state shared-empty"
            >
              <div class="empty-icon">
                ↗
              </div>

              <div>
                <strong>
                  No overlap yet.
                </strong>

                <p>
                  When a connection independently saves something
                  you've saved, it will appear here.
                </p>
              </div>
            </div>

            <div
              v-else
              class="shared-list"
            >
              <article
                v-for="shared in home?.sharedIntentions || []"
                :key="shared.peer + shared.item"
                class="shared-item"
              >
                <div class="shared-main">
                  <div class="activity-icon">
                    ↗
                  </div>

                  <div class="activity-copy">
                    <div class="item-name large-name">
                      {{ shared.name }}
                    </div>

                    <a
                      class="activity-link"
                      :href="shared.reference"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {{ displayReference(shared.reference) }}
                    </a>

                    <div class="shared-with">
                      You and
                      <strong>
                        @{{ shared.peer }}
                      </strong>
                      would both go
                    </div>
                  </div>
                </div>

                <button
                  class="button primary-button"
                  @click="choosePlan(shared)"
                >
                  Make a plan
                  <span aria-hidden="true">
                    →
                  </span>
                </button>
              </article>
            </div>
          </section>

          <section class="card">
            <div class="section-heading">
              <div>
                <div class="eyebrow">
                  Saved for later
                </div>

                <h2>
                  I'd Go
                </h2>
              </div>

              <span class="small-count">
                {{ home?.intentions?.length || 0 }}
              </span>
            </div>

            <div
              v-if="!home?.intentions?.length"
              class="empty-state"
            >
              <div>
                <strong>
                  Nothing saved yet.
                </strong>

                <p>
                  Add something above without committing to a date.
                </p>
              </div>
            </div>

            <div
              v-else
              class="stack-list"
            >
              <article
                v-for="intention in home?.intentions || []"
                :key="intention.intention"
                class="simple-row"
              >
                <div class="activity-copy">
                  <div class="item-name">
                    {{ intention.name }}
                  </div>

                  <a
                    class="activity-link"
                    :href="intention.reference"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ displayReference(intention.reference) }}
                  </a>
                </div>

                <span class="soft-badge">
                  I'd go
                </span>
              </article>
            </div>
          </section>

          <section class="card">
            <div class="section-heading">
              <div>
                <div class="eyebrow">
                  Your people
                </div>

                <h2>
                  Connections
                </h2>
              </div>
            </div>

            <div class="connection-form">
              <input
                v-model="connectionUsername"
                placeholder="Friend's username"
                @keyup.enter="requestConnection"
              />

              <button
                class="button primary-button compact-button"
                :disabled="
                  loading ||
                  !connectionUsername.trim()
                "
                @click="requestConnection"
              >
                Add
              </button>
            </div>

            <div
              v-if="home?.pendingRequests?.length"
              class="requests"
            >
              <div class="mini-heading">
                Requests
              </div>

              <article
                v-for="request in home?.pendingRequests || []"
                :key="request.request"
                class="connection-row request-row"
              >
                <div class="person">
                  <div class="avatar">
                    {{ request.requester.slice(0, 1).toUpperCase() }}
                  </div>

                  <div>
                    <strong>
                      @{{ request.requester }}
                    </strong>

                    <div class="meta">
                      wants to connect
                    </div>
                  </div>
                </div>

                <div class="row-actions">
                  <button
                    class="button primary-button compact-button"
                    @click="acceptConnection(request.request)"
                  >
                    Accept
                  </button>

                  <button
                    class="button ghost-button compact-button"
                    @click="declineConnection(request.request)"
                  >
                    Decline
                  </button>
                </div>
              </article>
            </div>

            <div
              v-if="!home?.connections?.length"
              class="empty-state compact-empty"
            >
              <p>
                Add a friend so WeShould can surface things you both
                want to do.
              </p>
            </div>

            <article
              v-for="connection in home?.connections || []"
              :key="connection.connection"
              class="connection-row"
            >
              <div class="person">
                <div class="avatar">
                  {{ connection.peer.slice(0, 1).toUpperCase() }}
                </div>

                <div>
                  <strong>
                    @{{ connection.peer }}
                  </strong>

                  <div class="meta">
                    Connected
                  </div>
                </div>
              </div>

              <button
                class="text-button"
                @click="disconnect(connection.connection)"
              >
                Disconnect
              </button>
            </article>
          </section>

          <section
            id="plan-composer"
            class="card plan-composer"
            :class="{
              'plan-composer-active': selectedPlanItem
            }"
          >
            <div class="section-heading">
              <div>
                <div class="eyebrow">
                  Turn overlap into a commitment
                </div>

                <h2>
                  Make a plan
                </h2>
              </div>
            </div>

            <div
              v-if="!selectedPlanItem"
              class="empty-state plan-empty"
            >
              <div class="empty-icon">
                ✓
              </div>

              <div>
                <strong>
                  Nothing to schedule yet.
                </strong>

                <p>
                  Pick “Make a plan” on a shared activity above.
                </p>
              </div>
            </div>

            <template v-else>
              <div class="selected-activity">
                <div class="selected-topline">
                  Planning with
                  <strong>
                    @{{ selectedPlanPeer }}
                  </strong>
                </div>

                <div class="selected-name">
                  {{ selectedPlanName }}
                </div>
              </div>

              <label>
                When should you go?

                <input
                  v-model="planTime"
                  placeholder="Friday at 8 PM"
                  @keyup.enter="proposePlan"
                />
              </label>

              <div class="row-actions">
                <button
                  class="button primary-button"
                  :disabled="
                    loading ||
                    !planTime.trim()
                  "
                  @click="proposePlan"
                >
                  Propose plan
                </button>

                <button
                  class="button ghost-button"
                  @click="clearPlanDraft"
                >
                  Never mind
                </button>
              </div>
            </template>
          </section>

          <section class="card plans-card">
            <div class="section-heading">
              <div>
                <div class="eyebrow">
                  From maybe to happening
                </div>

                <h2>
                  Plans
                </h2>
              </div>

              <span class="small-count">
                {{ home?.plans?.length || 0 }}
              </span>
            </div>

            <div
              v-if="!home?.plans?.length"
              class="empty-state"
            >
              <div>
                <strong>
                  Nothing planned yet.
                </strong>

                <p>
                  Shared intentions become plans once someone picks
                  a time.
                </p>
              </div>
            </div>

            <div
              v-else
              class="plans-list"
            >
              <article
                v-for="plan in home?.plans || []"
                :key="plan.plan"
                class="plan"
                :class="'plan-' + plan.status.toLowerCase()"
              >
                <div class="plan-main">
                  <div class="activity-copy">
                    <div class="plan-heading-row">
                      <div class="item-name large-name">
                        {{ plan.name }}
                      </div>

                      <span
                        class="status"
                        :class="'status-' + plan.status.toLowerCase()"
                      >
                        {{ prettyStatus(plan.status) }}
                      </span>
                    </div>

                    <a
                      class="activity-link"
                      :href="plan.reference"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {{ displayReference(plan.reference) }}
                    </a>

                    <div class="time-display">
                      {{ plan.time }}
                    </div>

                    <div class="plan-owner">
                      <template
                        v-if="plan.organizer === signedInUser"
                      >
                        You proposed this
                      </template>

                      <template v-else>
                        Proposed by
                        <strong>
                          @{{ plan.organizer }}
                        </strong>
                      </template>
                    </div>
                  </div>
                </div>

                <div
                  v-if="
                    plan.status === 'PROPOSED' &&
                    plan.organizer === signedInUser
                  "
                  class="plan-footer"
                >
                  <div class="waiting-copy">
                    Waiting for the other person to respond.
                  </div>

                  <button
                    class="button ghost-button compact-button"
                    @click="cancelPlan(plan.plan)"
                  >
                    Cancel
                  </button>
                </div>

                <div
                  v-else-if="
                    plan.status === 'PROPOSED' &&
                    plan.response === 'PENDING'
                  "
                  class="plan-footer"
                >
                  <div class="waiting-copy">
                    Are you in?
                  </div>

                  <div class="row-actions">
                    <button
                      class="button primary-button compact-button"
                      @click="
                        respondToPlan(
                          plan.plan,
                          'ACCEPTED'
                        )
                      "
                    >
                      Accept
                    </button>

                    <button
                      class="button ghost-button compact-button"
                      @click="
                        respondToPlan(
                          plan.plan,
                          'DECLINED'
                        )
                      "
                    >
                      Decline
                    </button>
                  </div>
                </div>

                <div
                  v-else-if="
                    plan.status === 'PROPOSED' &&
                    plan.response === 'ACCEPTED'
                  "
                  class="plan-footer"
                >
                  <div class="waiting-copy">
                    You're in — waiting for everyone else.
                  </div>
                </div>

                <div
                  v-else-if="
                    plan.status === 'PROPOSED' &&
                    plan.response === 'DECLINED'
                  "
                  class="plan-footer"
                >
                  <div class="waiting-copy">
                    You declined this plan.
                  </div>
                </div>

                <div
                  v-if="plan.status === 'COMMITTED'"
                  class="plan-footer committed-footer"
                >
                  <div class="committed-copy">
                    It's happening.
                  </div>

                  <div class="row-actions">
                    <button
                      class="button primary-button compact-button"
                      @click="completePlan(plan.plan)"
                    >
                      Mark done
                    </button>

                    <button
                      class="button ghost-button compact-button"
                      @click="cancelPlan(plan.plan)"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div
                  v-if="plan.status === 'COMPLETED'"
                  class="plan-footer"
                >
                  <div class="finished-copy">
                    ✓ You did it.
                  </div>
                </div>

                <div
                  v-if="plan.status === 'CANCELLED'"
                  class="plan-footer"
                >
                  <div class="finished-copy muted">
                    This plan was cancelled.
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </template>
    </main>
  `,
});

app.mount("#app");

const style =
  document.createElement("style");

style.textContent = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background:
      radial-gradient(
        circle at top right,
        rgba(235, 229, 216, 0.55),
        transparent 28rem
      ),
      #f8f7f3;
    color: #1d1c19;
    font-family:
      Inter,
      ui-sans-serif,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  button,
  input {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  .page {
    width: min(
      1160px,
      calc(100% - 48px)
    );
    margin: 0 auto;
    padding: 28px 0 88px;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 64px;
  }

  .identity {
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .logo-mark {
    display: grid;
    place-items: center;
    width: 39px;
    height: 39px;
    border-radius: 13px;
    background: #1d1c19;
    color: #fff;
    font-size: 15px;
    font-weight: 800;
  }

  .brand {
    font-size: 21px;
    font-weight: 800;
    letter-spacing: -0.045em;
  }

  .tagline {
    margin-top: 2px;
    color: #858178;
    font-size: 12px;
  }

  .signed-in,
  .row-actions,
  .auth-actions,
  .activity-url-row {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .username-pill {
    padding: 8px 12px;
    border: 1px solid #dedbd2;
    border-radius: 999px;
    background: rgba(
      255,
      255,
      255,
      0.7
    );
    font-size: 13px;
    font-weight: 700;
  }

  .eyebrow {
    color: #88837a;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .accent-eyebrow {
    color: #696257;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    max-width: 650px;
    margin-bottom: 16px;
    font-size: clamp(
      42px,
      6vw,
      70px
    );
    line-height: 0.94;
    letter-spacing: -0.06em;
  }

  h2 {
    margin: 5px 0 0;
    font-size: 25px;
    letter-spacing: -0.04em;
  }

  .hero {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      minmax(380px, 0.72fr);
    gap: 64px;
    align-items: end;
    margin-bottom: 34px;
  }

  .hero-subtitle {
    max-width: 540px;
    margin-bottom: 0;
    color: #747068;
    font-size: 16px;
    line-height: 1.55;
  }

  .activity-form {
    padding: 19px;
    border: 1px solid #e1ded5;
    border-radius: 20px;
    background: rgba(
      255,
      255,
      255,
      0.88
    );
    box-shadow:
      0 18px 50px
      rgba(42, 37, 30, 0.055);
  }

  .activity-form-heading {
    margin-bottom: 11px;
    font-size: 13px;
    font-weight: 750;
  }

  .activity-form > input {
    margin-bottom: 9px;
  }

  .activity-url-row input {
    flex: 1;
  }

  .form-note {
    margin-top: 10px;
    color: #99948a;
    font-size: 11px;
  }

  input {
    width: 100%;
    padding: 12px 13px;
    border: 1px solid #dad6cc;
    border-radius: 11px;
    background: #fff;
    color: #1d1c19;
    outline: none;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  input::placeholder {
    color: #aaa59c;
  }

  input:focus {
    border-color: #8c867b;
    box-shadow:
      0 0 0 3px
      rgba(50, 47, 42, 0.06);
  }

  .button {
    border: 0;
    border-radius: 999px;
    padding: 11px 17px;
    font-weight: 750;
    transition:
      transform 120ms ease,
      opacity 120ms ease,
      background 120ms ease;
  }

  .button:not(:disabled):active {
    transform: translateY(1px);
  }

  .button:disabled {
    cursor: default;
    opacity: 0.38;
  }

  .primary-button {
    background: #1d1c19;
    color: white;
  }

  .primary-button:hover:not(:disabled) {
    background: #34312c;
  }

  .secondary-button {
    background: #ebe8e0;
    color: #24221e;
  }

  .ghost-button {
    border: 1px solid #dedad0;
    background: transparent;
    color: #5e5a53;
  }

  .compact-button {
    padding: 8px 13px;
    font-size: 12px;
  }

  .text-button {
    padding: 0;
    border: 0;
    background: transparent;
    color: #9a958c;
    font-size: 12px;
  }

  .text-button:hover {
    color: #4f4b45;
  }

  .summary-strip {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 15px 20px;
    margin-bottom: 18px;
    border: 1px solid #e7e3da;
    border-radius: 16px;
    background: rgba(
      255,
      255,
      255,
      0.56
    );
  }

  .summary-item {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .summary-number {
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .summary-label {
    color: #858078;
    font-size: 12px;
  }

  .summary-divider {
    width: 1px;
    height: 18px;
    background: #ddd9d0;
  }

  .grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .card {
    padding: 23px;
    border: 1px solid #e5e1d8;
    border-radius: 20px;
    background: rgba(
      255,
      255,
      255,
      0.92
    );
    box-shadow:
      0 8px 30px
      rgba(45, 40, 31, 0.025);
  }

  .shared-card,
  .plans-card {
    grid-column: span 2;
  }

  .section-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
  }

  .section-description {
    max-width: 560px;
    margin: 7px 0 0;
    color: #858078;
    font-size: 13px;
    line-height: 1.5;
  }

  .count {
    display: grid;
    place-items: center;
    min-width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #efede7;
    font-weight: 800;
  }

  .small-count {
    display: grid;
    place-items: center;
    min-width: 29px;
    height: 29px;
    border-radius: 50%;
    background: #f0eee9;
    color: #67625a;
    font-size: 12px;
    font-weight: 800;
  }

  .empty-state {
    display: flex;
    gap: 13px;
    align-items: flex-start;
    padding: 18px 0 4px;
    color: #837f77;
  }

  .empty-state strong {
    color: #666158;
    font-size: 13px;
  }

  .empty-state p {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.5;
  }

  .shared-empty {
    padding: 22px;
    border-radius: 15px;
    background: #f5f3ee;
  }

  .compact-empty {
    padding: 18px 0 8px;
  }

  .plan-empty {
    padding-top: 8px;
  }

  .empty-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 33px;
    height: 33px;
    border-radius: 10px;
    background: #ebe8e1;
    color: #6f6a61;
    font-weight: 800;
  }

  .shared-list,
  .stack-list,
  .plans-list {
    display: grid;
    gap: 9px;
  }

  .shared-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    padding: 17px;
    border: 1px solid #e6e2d8;
    border-radius: 15px;
    background: #f8f6f1;
  }

  .shared-main {
    display: flex;
    align-items: flex-start;
    min-width: 0;
    gap: 13px;
  }

  .activity-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 37px;
    height: 37px;
    border-radius: 11px;
    background: #e9e5dc;
    font-size: 15px;
    font-weight: 800;
  }

  .activity-copy {
    min-width: 0;
  }

  .item-name {
    color: #26231f;
    font-size: 15px;
    font-weight: 760;
    overflow-wrap: anywhere;
  }

  .large-name {
    font-size: 17px;
  }

  .activity-link {
    display: block;
    max-width: 500px;
    margin-top: 3px;
    overflow: hidden;
    color: #98938a;
    font-size: 11px;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .activity-link:hover {
    color: #625e57;
    text-decoration: underline;
  }

  .shared-with {
    margin-top: 7px;
    color: #777269;
    font-size: 12px;
  }

  .simple-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 13px 0;
    border-top: 1px solid #efede8;
  }

  .simple-row:first-child {
    border-top: 0;
  }

  .soft-badge {
    flex: 0 0 auto;
    padding: 6px 9px;
    border-radius: 999px;
    background: #f2f0eb;
    color: #7d786f;
    font-size: 10px;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .connection-form {
    display: flex;
    gap: 9px;
    margin-bottom: 10px;
  }

  .connection-form input {
    flex: 1;
  }

  .mini-heading {
    margin: 19px 0 6px;
    color: #8b867e;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .connection-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px 0;
    border-top: 1px solid #efede8;
  }

  .person {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .avatar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ebe8e1;
    color: #5e5a52;
    font-size: 11px;
    font-weight: 800;
  }

  .meta {
    margin-top: 2px;
    color: #969188;
    font-size: 11px;
  }

  .plan-composer {
    scroll-margin: 110px;
    transition:
      border-color 180ms ease,
      box-shadow 180ms ease;
  }

  .plan-composer-active {
    border-color: #bbb4a7;
    box-shadow:
      0 16px 42px
      rgba(41, 35, 28, 0.075);
  }

  .selected-activity {
    padding: 16px;
    margin-bottom: 17px;
    border-radius: 14px;
    background: #f3f1eb;
  }

  .selected-topline {
    color: #817c72;
    font-size: 11px;
  }

  .selected-name {
    margin-top: 5px;
    font-size: 21px;
    font-weight: 780;
    letter-spacing: -0.035em;
  }

  label {
    display: grid;
    gap: 7px;
    margin: 16px 0;
    color: #57534c;
    font-size: 12px;
    font-weight: 700;
  }

  .plan {
    overflow: hidden;
    border: 1px solid #e7e3da;
    border-radius: 15px;
    background: #fff;
  }

  .plan-main {
    padding: 17px;
  }

  .plan-heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .time-display {
    margin-top: 11px;
    color: #26231f;
    font-size: 14px;
    font-weight: 700;
  }

  .plan-owner {
    margin-top: 5px;
    color: #8b867d;
    font-size: 11px;
  }

  .status {
    flex: 0 0 auto;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.05em;
  }

  .status-proposed {
    background: #f1eee6;
    color: #736d62;
  }

  .status-committed {
    background: #e8eee7;
    color: #4e6550;
  }

  .status-completed {
    background: #ecebea;
    color: #5d5b57;
  }

  .status-cancelled {
    background: #f2efed;
    color: #918980;
  }

  .plan-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 12px 17px;
    border-top: 1px solid #eeeae2;
    background: #faf9f6;
  }

  .committed-footer {
    background: #f3f6f2;
  }

  .waiting-copy,
  .finished-copy,
  .committed-copy {
    color: #777168;
    font-size: 12px;
    font-weight: 650;
  }

  .committed-copy {
    color: #526553;
  }

  .finished-copy {
    color: #5f5b54;
  }

  .muted {
    color: #9b958c;
  }

  .error {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 14px;
    margin: -35px 0 28px;
    border: 1px solid #ecc6bf;
    border-radius: 11px;
    background: #fff3f0;
    color: #8d4338;
    font-size: 12px;
    font-weight: 650;
  }

  .error-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #b65d4f;
  }

  .auth-shell {
    display: grid;
    min-height: 65vh;
    place-items: center;
  }

  .auth-card {
    width: min(
      520px,
      100%
    );
    padding: 36px;
    border: 1px solid #e3dfd6;
    border-radius: 25px;
    background: rgba(
      255,
      255,
      255,
      0.92
    );
    box-shadow:
      0 24px 70px
      rgba(43, 37, 29, 0.07);
  }

  .auth-title {
    margin-top: 11px;
    font-size: 43px;
  }

  .auth-copy {
    color: #746f67;
    font-size: 14px;
    line-height: 1.6;
  }

  .auth-fields {
    margin-top: 26px;
  }

  @media (max-width: 800px) {
    .page {
      width: min(
        100% - 26px,
        1160px
      );
    }

    .topbar {
      align-items: flex-start;
    }

    .hero {
      grid-template-columns: 1fr;
      gap: 28px;
    }

    .grid {
      grid-template-columns: 1fr;
    }

    .shared-card,
    .plans-card {
      grid-column: span 1;
    }

    .summary-strip {
      gap: 13px;
      overflow-x: auto;
    }

    .summary-item {
      min-width: max-content;
    }

    .shared-item,
    .plan-footer {
      align-items: flex-start;
      flex-direction: column;
    }

    .shared-item .button {
      width: 100%;
    }
  }

  @media (max-width: 560px) {
    .page {
      width: min(
        100% - 20px,
        1160px
      );
      padding-top: 18px;
    }

    .topbar {
      flex-direction: column;
      margin-bottom: 44px;
    }

    .signed-in {
      width: 100%;
      justify-content: space-between;
    }

    h1 {
      font-size: 47px;
    }

    .activity-url-row,
    .connection-form,
    .auth-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .summary-divider {
      display: none;
    }

    .summary-strip {
      justify-content: space-between;
    }

    .summary-item {
      align-items: flex-start;
      flex-direction: column;
      gap: 1px;
    }

    .row-actions {
      flex-wrap: wrap;
    }
  }
`;

document.head.appendChild(
  style,
);