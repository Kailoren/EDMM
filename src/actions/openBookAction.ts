import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { DASHBOARD_PORT } from "../dashboard/server.js";

@action({ UUID: "com.kailo.edminingbook.openbook" })
export class OpenBookAction extends SingletonAction {
	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		await streamDeck.system.openUrl(`http://127.0.0.1:${DASHBOARD_PORT}/`);
		await ev.action.showOk();
	}
}
