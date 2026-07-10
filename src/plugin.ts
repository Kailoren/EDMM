import streamDeck from "@elgato/streamdeck";
import { GoodRockAction } from "./actions/goodRockAction.js";
import { OpenBookAction } from "./actions/openBookAction.js";
import { OpenFolderAction } from "./actions/openFolderAction.js";
import { SelectMineralAction } from "./actions/selectMineralAction.js";
import { SessionToggleAction } from "./actions/sessionToggleAction.js";
import { UndoAction } from "./actions/undoAction.js";
import { startDashboardServer } from "./dashboard/server.js";
import { journalTailer } from "./runtime.js";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new SessionToggleAction());
streamDeck.actions.registerAction(new SelectMineralAction());
streamDeck.actions.registerAction(new GoodRockAction());
streamDeck.actions.registerAction(new UndoAction());
streamDeck.actions.registerAction(new OpenBookAction());
streamDeck.actions.registerAction(new OpenFolderAction());

journalTailer.start();
startDashboardServer();

streamDeck.connect();
