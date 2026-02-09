import './style.css'

const output = document.getElementById("webcam");
const error = document.getElementById("error");

async function probe() {
    await navigator.mediaDevices.getUserMedia({ audio: true });
}

async function listDevices() {
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
        (d) => d.kind === "videoinput",
    );

    console.log("devices", devices);

    return devices;
}

async function setup(devices: MediaDeviceInfo[]) {
    const params = new URLSearchParams(window.location.search);

    if (!output) {
        return
    }

    if (params.get("input") === null) return
    // Display video:

    let device = undefined;
    if (!device) {
        // Match id/label:
        const deviceId = params.get("input");
        if (deviceId !== undefined) {
            console.log("deviceId", deviceId);
            device = devices.find(
                (d) => d.deviceId === deviceId || d.label === deviceId,
            );
        }
    }

    if (device) {
        console.log("Using device:", device);
        const elVideo = document.createElement("video");
        elVideo.autoplay = true;
        output.appendChild(elVideo);

        const constraints: MediaStreamConstraints = {};
        constraints.video = {
            deviceId: {
                exact: device.deviceId,
            },
            // @ts-ignore
            // resizeMode: 'crop-and-scale'
        };
        if (params.get("fps") !== null) {
            constraints.video.frameRate = {
                exact: Number(params.get("fps")),
            };
        }
        if (params.get("height") !== null) {
            constraints.video.height = {
                exact: Number(params.get("height")),
            };
        }

        // Open stream:
        console.log("open stream...", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        //   elVideo.src = stream;

        console.log("got stream");
        elVideo.srcObject = stream;
        elVideo.addEventListener("loadedmetadata", () => {
            console.log("loadedMetadata");
            elVideo.play();
        });
    } else {
        console.error("device not found");
    }
}

try {
    await probe();
    const devices = await listDevices();
    console.log("devices: " + devices.length);

    if (output) {
        output.innerHTML =
            "<ul>" +
            devices
                .map(
                    (d, i) =>
                        `<li><a href="?input=${d.deviceId}">index: ${i}, id: "${d.label}", label: "${d.label}"</a></li>`,
                )
                .join("") +
            "</ul>";
    }

    await setup(devices);
} catch (e) {
    console.error("caught error:");
    console.error(e + "");
    console.error(e);

    if (error) {
        error.innerHTML = "Error: " + e;
    }
}
