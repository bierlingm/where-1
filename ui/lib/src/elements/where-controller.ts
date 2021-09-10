import { html, css, LitElement } from "lit";
import { state } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { contextStore } from "lit-svelte-stores";
import { Unsubscriber } from "svelte/store";

import { sharedStyles } from "../sharedStyles";
import { whereContext, Space, Dictionary, Signal } from "../types";
import { WhereStore } from "../where.store";
import { WhereSpace } from "./where-space";
import { WhereSpaceDialog } from "./where-space-dialog";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";

/**
 * @element where-controller
 */
export class WhereController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */

  /** Dependencies */

  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  @contextStore({
    context: profilesStoreContext,
    selectStore: (s) => s.myProfile,
  })
  _myProfile!: Profile;

  @contextStore({
    context: profilesStoreContext,
    selectStore: (s) => s.knownProfiles,
  })
  _knownProfiles!: Dictionary<Profile>;

  @contextStore({
    context: whereContext,
    selectStore: (s) => s.spaces,
  })
  _spaces!: Dictionary<Space>;

  @contextStore({
    context: whereContext,
    selectStore: (s) => s.zooms,
  })
  _zooms!: Dictionary<number>;

  /** Private properties */

  @state() _current = "";
  @state() _myAvatar = "https://i.imgur.com/oIrcAO8.jpg";

  private initialized = false;

  get myNickName(): string {
    return this._myProfile.nickname;
  }

  firstUpdated() {

    let unsubscribe: Unsubscriber;
    unsubscribe = this._profiles.myProfile.subscribe(() => {
      this.checkInit();
      //      unsubscribe()
    });
  }

  async checkInit() {
    if (!this.initialized) {
      let spaces = await this._store.updateSpaces();
      // load up a space if there are none:
      if (Object.keys(spaces).length == 0) {
        console.log("no spaces found, initializing")
        await this.initializeSpaces();
        spaces = await this._store.updateSpaces();
      }
      this._current = Object.keys(spaces)[0];
      console.log("current space", this._current, spaces[this._current].name);
    }
    this.initialized = true;
  }

  async initializeSpaces() {
    const myPubKey = this._profiles.myAgentPubKey;
    await this._store.addSpace({
      name: "earth",
      surface: {
        url: "https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg",
        size: { x: 3840, y: 1799 },
        data: `[{"box":{"left":100,"top":10,"width":100,"height":50},"style":"padding:10px;background-color:white;border-radius: 10px;","content":"Land of the Lost"}]`,
      },
      meta: {},
      wheres: [
        {
          entry: {
            location: { x: 1150, y: 450 },
            meta: {
              img: this._myAvatar,
              name: this.myNickName,
              tag: "My house",
            },
          },
          hash: "",
          authorPubKey: myPubKey,
        },
        {
          entry: {
            location: { x: 1890, y: 500 },
            meta: {
              name: "Monk",
              tag: "My apartment",
              img: "https://i.imgur.com/4BKqQY1.png",
            },
          },
          hash: "",
          authorPubKey: "sntahoeuabcorchaotbkantgcdoesucd",
        },
      ],
    });
    await this._store.addSpace({
      name: "Ecuador",
      surface: {
        url: "https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg",
        size: { x: 800, y: 652 },
        data: "[]",
      },
      meta: { multi: "true" },
      wheres: [],
    });
    await this._store.addSpace({
      name: "Abstract",
      surface: {
        url: "",
        size: { x: 1000, y: 700 },
        data: `[{"box":{"left":0,"top":0,"width":1000,"height":700},"style":"background-image: linear-gradient(to bottom right, red, yellow);","content":""},{"box":{"left":450,"top":300,"width":100,"height":100},"style":"background-color:blue;border-radius: 10000px;","content":""}]`,
      },
      meta: { multi: "true" },
      wheres: [],
    });
  }

  async refresh() {
    await this._store.updateSpaces();
  }

  get spaceElem(): WhereSpace {
    return this.shadowRoot!.getElementById("where-space") as WhereSpace;
  }

  async openSpaceDialog() {
    this.spaceDialogElem.open();
  }

  get spaceDialogElem() : WhereSpaceDialog {
    return this.shadowRoot!.getElementById("space-dialog") as WhereSpaceDialog;
  }

  private handleSpaceSelect(space: string): void {
    this._current = space;
    this.spaceElem.current = space;
  }

  private handleZoom(zoom: number): void {
    this.spaceElem.zoom(zoom);
  }

  render() {
    if (!this._current) return; // html`<mwc-button  @click=${() => this.checkInit()}>Start</mwc-button>`;
    const folks = Object.entries(this._knownProfiles).map(([key, profile])=>{
      return html`<li class="folk">${profile.nickname}</li>`
    })
    return html`
<mwc-select outlined label="Space" @select=${this.handleSpaceSelect}>
${Object.entries(this._spaces).map(
  ([key, space]) => html`
    <mwc-list-item
      @request-selected=${() => this.handleSpaceSelect(key)}
      .selected=${key === this._current}
      value="${key}"
      >${space.name}
    </mwc-list-item>
  `
)}
</mwc-select>
<div class="zoom">
  Zoom: ${(this._zooms[this._current] * 100).toFixed(0)}% <br/>
  <mwc-icon-button icon="add_circle" @click=${() =>
    this.handleZoom(0.1)}></mwc-icon-button>
  <mwc-icon-button icon="remove_circle" @click=${() =>
    this.handleZoom(-0.1)}></mwc-icon-button>
</div>
<mwc-button icon="add_circle" @click=${() =>
      this.openSpaceDialog()}>New</mwc-button>
<mwc-button icon="refresh" @click=${() => this.refresh()}>Refresh</mwc-button>

<div class="folks">
Folks:
${folks}
</div>

<where-space-dialog id="space-dialog" @space-added=${(e:any) => this._current = e.detail}> ></where-space-dialog>

<where-space id="where-space" .current=${this._current} .avatar=${this._myAvatar}></where-space>
`;
  }

  static get scopedElements() {
    return {
      "mwc-select": Select,
      "mwc-list-item": ListItem,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      "where-space-dialog" : WhereSpaceDialog,
      "where-space": WhereSpace,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          margin: 10px;
        }

        .zoom {
          display: inline-block;
        }
        .zoom mwc-icon-button {
          height: 30px;
          margin-top: -8px;
        }

        .folks {
          float:right;
        }
        .folk {
list-style: none
        }

        @media (min-width: 640px) {
          main {
            max-width: none;
          }
        }
      `,
    ];
  }
}
