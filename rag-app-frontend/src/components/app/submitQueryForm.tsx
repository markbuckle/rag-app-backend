"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import createApiClient from "@/lib/getApiClient";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSessionId } from "@/lib/getUserId";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

// make the api and get the userid
export default function SubmitQueryForm() {
  const api = createApiClient();
  const userId = getSessionId();
  // placeholder question for the form
  const originalPlaceHolder: string = "How do I increase neuroplasticity?";

  // hook 1:  store the query text inside of our form
  const [query, setQuery] = useState("");
  // hook 2:  store the boolean for whether or not were in the middle of submitting a query
  const [isSubmitting, setIsSubmitting] = useState(false);
  // make the page navigate away after submitting a query
  const router = useRouter();

  // submit the query
  const submitForm = () => {
    // we'll use the query if it's not null, otherwise we'll use the placeholder question instead
    const queryToSubmit = query || originalPlaceHolder;
    console.log(`Submitting query: ${queryToSubmit}`);
    // create the api request
    const request = { queryText: queryToSubmit, userId: userId };
    // send the api request
    const response = api.submitQueryEndpointSubmitQueryPost({
      submitQueryRequest: request,
    });

    // tell the app we hit the submit button
    setIsSubmitting(true);
    response.then((data) => {
      console.log(data);
      // navigate to the viewQuery page and add queryid to the url parameter
      router.push(`/viewQuery?queryId=${data.queryId}`);
    });
  };

  // styling
  const textArea = (
    <Textarea
      placeholder={originalPlaceHolder}
      value={query} // current value of the text area
      disabled={isSubmitting} // disable form while submitting
      // set the callback function so that whenever the query is changed we update the query state
      onChange={(e) => {
        setQuery(e.currentTarget.value);
      }}
    />
  );

  // disable submit button if form is being submitted and link it to submitForm
  const submitButton = (
    <Button onClick={submitForm} disabled={isSubmitting} className="ml-auto">
      {/* the button will display a loading spinner only if its in the process of being submitted */}
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit
    </Button>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Submit New Query</CardTitle>
        <CardDescription>
          Ask a question about Andrew Huberman's podcast. A podcast aimed to
          give help you navigate your health journey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">{textArea}</div>
      </CardContent>
      <CardFooter>{submitButton}</CardFooter>
    </Card>
  );
}
