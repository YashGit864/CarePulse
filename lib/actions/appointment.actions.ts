"use server";

import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import {formatDateTime, parseStringify} from "../utils";
import {getClient} from "@/lib/appwrite.config";
import {Appointment} from "@/types/appwrite.types";

const { databases, users, storage, messaging } = getClient();
const {
    NEXT_PUBLIC_DATABASE_ID: DATABASE_ID,
    NEXT_PUBLIC_PATIENT_COLLECTION_ID: PATIENT_COLLECTION,
    NEXT_PUBLIC_APPOINTMENT_COLLECTION_ID: APPOINTMENT_COLLECTION,
} = process.env;

export const createAppointment = async (appointment: CreateAppointmentParams) => {
    try {
        const newAppointment = await databases.createDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION!,
            ID.unique(),
            appointment
        );

        revalidatePath("/admin");
        return parseStringify(newAppointment);
    } catch (error) {
        console.error("An error occurred while creating a new appointment:", error);
    }
};

export const getAppointment = async (appointmentId: string) => {
    try{
        const appointment = await databases.getDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION!,
            appointmentId
            );
        return parseStringify(appointment);
    } catch (e){
        console.log(e)
    }
}

export const getRecentAppointments = async () => {
    try {
        const result = await databases.listDocuments(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION!,
            [Query.orderDesc("$createdAt")]
        );

        const appointments = result.documents;
        const uniquePatientIds = [...new Set(appointments.map(a => a.patient))];
        const patientMap: Record<string, any> = {};

        await Promise.all(
            uniquePatientIds.map(async (id) => {
                patientMap[id] = await databases.getDocument(
                    DATABASE_ID!,
                    PATIENT_COLLECTION!,
                    id
                );
            })
        );

        // Merge patient objects into appointments
        const enrichedAppointments = appointments.map((a) => ({
            ...a,
            patient: patientMap[a.patient] || null,
        }))

        const initialCounts = {
            pendingCount: 0,
            scheduledCount: 0,
            cancelledCount: 0,
        };

        const counts = enrichedAppointments.reduce((acc, appointment) => {
            switch (appointment.status) {
                case "scheduled":
                    acc.scheduledCount++;
                    break;
                case "pending":
                    acc.pendingCount++;
                    break;
                case "cancelled":
                    acc.cancelledCount++;
                    break;
            }
            return acc;
        }, initialCounts);

        return {
            appointments: enrichedAppointments,
            totalCount: result.total,
            ...counts
        };

    } catch (e) {
        console.log("Error loading appointments:", e);
        return null;
    }
};

export const updateAppointment = async ({appointmentId, userId, appointment, type}: UpdateAppointmentParams) => {
    try {
        const updatedAppointment = await databases.updateDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION!,
            appointmentId,
            appointment)

        if(!updatedAppointment)
            throw new Error("Appointment not found")

        const smsMessage = `
        Hi, it's CarePulse.
        ${type === "schedule" 
            ? `Your appointment has been scheduled on ${formatDateTime(appointment.schedule).dateTime} with ${appointment.primaryPhysician}.`  
            : `Your appointment has been cancelled. Reason: ${appointment.cancellationReason}.`
        }`
        await sendSMSNotification(userId, smsMessage);

        revalidatePath("/admin");
        return parseStringify(updatedAppointment);
    } catch (error) {
        console.log(error)
    }
}

export const sendSMSNotification = async (userId: string, content: string) => {
    const message = await messaging.createSMS(
        ID.unique(),
        content,
        [],
        [userId]
    )

    return parseStringify(message);
}