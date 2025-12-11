'use server'

import { ID, Query } from 'node-appwrite'
import { getClient } from '@/lib/appwrite.config'
import {parseStringify} from "@/lib/utils";
const { databases, users, storage, messaging } = getClient();
const {
  NEXT_PUBLIC_BUCKET_ID: BUCKET_ID,
  NEXT_PUBLIC_ENDPOINT: ENDPOINT,
  NEXT_PUBLIC_PROJECT_ID: PROJECT_ID,
  NEXT_PUBLIC_DATABASE_ID: DATABASE_ID,
  NEXT_PUBLIC_PATIENT_COLLECTION_ID: PATIENT_COLLECTION,
} = process.env;

export const createUser = async (user: CreateUserParams) => {
  try {
    const newUser = await users.create({
      userId: ID.unique(),
      email: user.email,
      phone: user.phone,
      password: undefined,
      name: user.name,
    })

    return JSON.parse(JSON.stringify(newUser))
  } catch (e: any) {
    if (e && e?.code === 409) {
      const result = await users.list([Query.equal('email', [user.email])])
      return result?.users?.[0] ?? null
    }
    throw e
  }
}

export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId)

    return JSON.parse(JSON.stringify(user))
  } catch (e){
    console.log(e)
  }
}

export const registerPatient = async ({identificationDocument, ...patient}: RegisterUserParams) => {
  try {
    // Upload file ->  // https://appwrite.io/docs/references/cloud/client-web/storage#createFile
    let file;
    if (identificationDocument) {
      const blob = identificationDocument.get('blobFile') as Blob | File;
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const serverFile = new File([buffer], identificationDocument.get('fileName') as string);

      file = await storage.createFile(
          BUCKET_ID!,
          ID.unique(),
          serverFile
      );
      file = await storage.createFile(BUCKET_ID!, ID.unique(), serverFile);
    }
    const newPatient = await databases.createDocument(
        DATABASE_ID!,
        PATIENT_COLLECTION!,
        ID.unique(),
        {
          ...patient,
          identificationDocumentId: file?.$id ? file.$id : null,
          identificationDocumentUrl: file?.$id
              ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view??project=${PROJECT_ID}`
              : null,
        }
    );
    return parseStringify(newPatient);
  } catch (e) {
    console.log(e)
  }
}

export const getPatient = async (userId: string) => {
  try {
    const patients = await databases.listDocuments(
        DATABASE_ID!,
        PATIENT_COLLECTION!,
        [Query.equal('userId', [userId])]
    );
    return parseStringify(patients.documents[0])

  } catch (e){
    console.log(e)
  }
}
