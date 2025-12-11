import React from 'react';
import Image from "next/image";
import {AppointmentForm} from "@/components/forms/AppointmentForm";
import {getPatient} from "@/lib/actions/patient.actions";

export default async function NewAppointment(props: SearchParamProps) {
    const raw = await props;
    const params = await raw.params;
    const { userId } = params as { userId?: string };

    // defensive check to surface a clear error if the route param is missing
    if (!userId) {
        console.error('route params:', params);
        throw new Error(`params.userId is undefined — check that the dynamic route folder is named [userId] and that you are visiting a URL like /patients/<userId>/new-appointment. params: ${JSON.stringify(params)}`);
    }
    const patient = await getPatient(userId)
    return (
        <div className='flex h-screen max-h-screen'>
            <section className='remove-scrollbar container my-auto'>
                <div className='sub-container max-w-[860px] flex-1 justify-between'>
                    <Image
                        src='/assets/icons/logo-full.svg'
                        height={1000}
                        width={1000}
                        alt='CarePulse Logo'
                        className='mb-12 h-10 w-fit'
                    />

                    <AppointmentForm
                        patientId={patient?.$id}
                        type='create'
                        userId={userId}
                    />

                    <p className='copyright mt-10 py-12'>
                        © 2025 CarePulse
                    </p>
                </div>
            </section>

            <Image
                src='/assets/images/appointment-img.png'
                alt='appointment'
                height={1000}
                width={1000}
                className='side-img max-w-[390px] bg-bottom'
            />
        </div>
    );
}