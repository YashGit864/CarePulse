import * as sdk from 'node-appwrite'

export const getClient = () => {
    const client = new sdk.Client();
    client
        .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        databases: new sdk.Databases(client),
        storage: new sdk.Storage(client),
        users: new sdk.Users(client),
        messaging: new sdk.Messaging(client),
    };
};
