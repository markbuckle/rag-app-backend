"use client";

import { QueryModel } from "@/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import createApiClient from "@/lib/getApiClient";
import { ArrowLeft, Link2, Loader } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// set queryId function
export default function ViewQueryPage() {
  // get the query id from our url
  const searchParams = useSearchParams();
  const queryId = searchParams.get("queryId"); // Updated to match the URL parameter name
  //   use our previous helper function to get a new API client
  const api = createApiClient();
  //   store the query item with a useState hook. Every time we set a new value for this hook, the component will re-render
  const [queryItem, setQueryItem] = useState<QueryModel>();
  const [error, setError] = useState<string | null>(null); // Define the error state variable

  // Create another hook to call the API. If you want something to happen just once per page load, you need to put it in a useEffect hook like this. If not, the API will get called every time the component is refreshed and this could cause an infinite loop.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const request = {
          queryId: queryId!,
        };
        const response = await api.getQueryEndpointGetQueryGet(request);
        setQueryItem(response);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
      }
    };
    if (queryId) {
      fetchData();
    }
  }, [queryId]); // Added queryId as a dependency to useEffect

  let viewQueryElement;

  if (error) {
    viewQueryElement = <div className="text-red-500">{error}</div>;
  } else if (!queryItem) {
    viewQueryElement = (
      <div>
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  } else {
    if (!queryItem.sources) {
      queryItem.sources = [];
    }
    const sourcesElement = queryItem.sources!.map((source) => {
      return (
        <Link key={source} href={`/source/${source}`}>
          <div className="text-xs flex text-slate-500 hover:underline">
            <Link2 className="mr-2 h-4 w-4" />
            {source}
          </div>
        </Link>
      );
    });

    const isComplete = queryItem.isComplete;
    const answerElement = isComplete ? (
      <>
        <div className="font-bold">Response</div>
        {queryItem?.answerText}
        <div className="mt-4">{sourcesElement}</div>
      </>
    ) : (
      <div className="text-slate-500 flex">
        <Loader className="h-4 w-4 mr-2 my-auto" />
        Still loading. Please try again later.
      </div>
    );

    queryItem.answerText || "Query still in progress. Please wait...";

    // Displayed Element.
    viewQueryElement = (
      <>
        {/*  Question element */}
        <div className="bg-blue-100 text-blue-800 p-3 rounded-sm">
          <div className="font-bold">Question</div>
          {queryItem?.queryText}
        </div>
        {/*  Answer element */}
        <div className="bg-slate-100 text-slate-700  p-3 rounded-sm">
          {answerElement}
        </div>
      </>
    );
  }

  //   Configure the entire UI using a card component
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>View Query</CardTitle>
          <CardDescription>Query ID: {queryId}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {viewQueryElement}
        </CardContent>
        <CardFooter className="flex justify-between">
          {/* link to go back to the homepage*/}
          <Link href="/">
            <Button variant="outline">
              {" "}
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </>
  );
}
