import { Guid } from "@itwin/core-bentley";
import {
    BentleyCloudRpcManager,
    IModelReadRpcInterface,
    IModelTileRpcInterface,
    RpcConfiguration,
    SerializedRpcActivity
} from "@itwin/core-common";
import { NodeCliAuthorizationClient } from "@itwin/node-cli-authorization"
import { config } from "dotenv";

config()

async function run() {
    const accessToken = await getAccessToken()

    RpcConfiguration.requestContext.getId = (_request): string => {
        return Guid.createValue();
    };

    RpcConfiguration.requestContext.serialize = async (_request): Promise<SerializedRpcActivity> => {
        const id = _request.id;
        const serialized: SerializedRpcActivity = {
            id,
            applicationId: "2686",
            applicationVersion: "1.0.0",
            sessionId: Guid.createValue(),
            authorization: accessToken
        };

        return serialized;
    };

    BentleyCloudRpcManager.initializeClient({
        info: { title: "imodel/rpc", version: "v4" },
        uriPrefix: "https://api.bentley.com",
    }, [IModelReadRpcInterface, IModelTileRpcInterface])


    const client = IModelReadRpcInterface.getClient()

    return client.getConnectionProps({
        iTwinId: process.env.ITWIN_ID,
        iModelId: process.env.IMODEL_ID,
        changeset: { id: process.env.CHANGESET_ID! }
    })
}

async function getAccessToken() {
    const authClient = new NodeCliAuthorizationClient({ clientId: process.env.CLIENT_ID!, scope: process.env.SCOPE! })
    await authClient.signIn()
    return authClient.getAccessToken()
}

run().then((res) => {
    console.log(res)
}).catch(err => {
    console.error(err)
})