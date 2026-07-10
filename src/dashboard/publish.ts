import { ZipArchive } from "archiver";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { annotatedFilename, type BookManifest } from "../store/bookManifest.js";
import { renderPublishedViewer, type PublishedManifest } from "./publishedViewer.js";

export interface PublishedBook {
	buffer: Buffer;
	filename: string;
}

/**
 * Packages a ring's finished book (screenshots - preferring the annotated
 * version when one exists - plus notes) into a single .zip: the images, a
 * clean manifest.json, and a bundled standalone HTML viewer so a recipient
 * can just unzip and open index.html with no plugin or server needed.
 */
export async function buildPublishedBook(folder: string, manifest: BookManifest): Promise<PublishedBook> {
	const publishedManifest: PublishedManifest = {
		starSystem: manifest.starSystem,
		body: manifest.body,
		ring: manifest.ring,
		mineral: manifest.mineral,
		publishedAt: new Date().toISOString(),
		shots: manifest.shots.map((shot) => ({
			file: shot.file,
			capturedAt: shot.capturedAt,
			note: shot.note ?? ""
		}))
	};

	const archive = new ZipArchive({ zlib: { level: 9 } });
	const chunks: Buffer[] = [];
	const done = new Promise<Buffer>((resolve, reject) => {
		archive.on("data", (chunk: Buffer) => chunks.push(chunk));
		archive.on("error", reject);
		archive.on("end", () => resolve(Buffer.concat(chunks)));
	});

	for (const shot of manifest.shots) {
		const annotated = annotatedFilename(shot.file);
		const sourceFile = existsSync(join(folder, annotated)) ? annotated : shot.file;
		const sourcePath = join(folder, sourceFile);
		if (existsSync(sourcePath)) {
			archive.append(readFileSync(sourcePath), { name: `images/${shot.file}` });
		}
	}

	archive.append(JSON.stringify(publishedManifest, null, 2), { name: "manifest.json" });
	archive.append(renderPublishedViewer(publishedManifest), { name: "index.html" });

	await archive.finalize();
	const buffer = await done;

	const safeName = `${manifest.starSystem} - ${manifest.body} - ${manifest.ring}${manifest.mineral ? ` - ${manifest.mineral}` : ""}`.replace(
		/[<>:"/\\|?*]/g,
		"_"
	);
	return { buffer, filename: `${safeName}.streamdeckbook.zip` };
}
