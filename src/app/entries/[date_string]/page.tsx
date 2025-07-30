import { notFound } from "next/navigation";
import { Suspense } from "react";
import EntryContent from "@/components/entry-content";
import { formatDateForDisplay } from "@/lib/date-utils";
import Link from "next/link";
import { ApiEntry, EntryWithComputed } from "@/types/entry";

interface EntryPageProps {
  params: { date_string: string };
}

type EntryResponse = (ApiEntry & EntryWithComputed) | { isPastDate: true };

// Function to fetch or create the entry data from the API
async function getEntry(dateString: string): Promise<EntryResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/entries/find-or-create/${dateString}`,
    {
      method: "GET",
      cache: "no-store", // Ensure fresh data
    }
  );

  if (response.ok) {
    console.log(`Entry found or created successfully for ${dateString}.`);
    return response.json();
  }

  if (response.status === 403) {
    console.warn(
      `Cannot create new entries for past dates. Please select a current or future date.`
    );
    return { isPastDate: true };
  }

  throw new Error(`Failed to fetch entry: ${response.statusText}`);
}

// Synchronous wrapper component to perform initial validation and setup Suspense
function EntryPageWrapper({ dateString }: { dateString: string }) {
  // Basic validation for the date string format
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  if (!isValidDate) {
    console.error(`Invalid date string format: ${dateString}`);
    return notFound();
  }

  // Wrap the async content component in Suspense for loading state
  return (
    <Suspense fallback={<div className="text-center py-12">Loading entry...</div>}>
      <EntryPageContent dateString={dateString} />
    </Suspense>
  );
}

// Asynchronous component to fetch data and render the appropriate UI
async function EntryPageContent({ dateString }: { dateString: string }) {
  const entry = await getEntry(dateString);

  // Handle the case where the API indicates a past date entry attempt
  if ('isPastDate' in entry) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground">Past Date Entry</h2>
        <p className="mt-4 text-muted-foreground">
          You cannot create new entries for past dates.
        </p>
        <Link
          href="/entries"
          className="mt-6 inline-block text-muted-foreground hover:text-foreground border border-border px-4 py-2 rounded-md"
        >
          Back to Current Entries
        </Link>
      </div>
    );
  }

  // Render the main entry content if an entry was found or created
  return <EntryContent entry={entry} dateString={dateString} />;
}

// The main page component exports the synchronous wrapper
export default async function EntryPage({ params }: EntryPageProps) {
  const resolvedParams = await params;
  return <EntryPageWrapper dateString={resolvedParams.date_string} />;
}