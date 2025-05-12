import { Helmet } from "react-helmet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ChevronsRight, Info, Search, MapPin, Building } from "lucide-react";
import { Link } from "wouter";

const AttomSearchHelp = () => {
  return (
    <>
      <Helmet>
        <title>ATTOM API Search Help | RealComp - Real Estate Comparison Tool</title>
        <meta
          name="description"
          content="Learn how to use the specialized ATTOM property search interface to find real estate properties with precision."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-primary/10 p-3 rounded-full">
            <Info className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1">ATTOM Property Search Guide</h1>
            <p className="text-muted-foreground">
              Learn how to use our specialized property search interface
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <Search className="h-5 w-5 text-primary mb-2" />
              <CardTitle className="text-lg">Basic Search</CardTitle>
              <CardDescription>
                Find properties using simple search parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Use the address, ZIP code, or geographic search options to quickly
                find properties in specific areas.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <Link href="/attom-search">
                  <Search className="h-4 w-4 mr-2" />
                  Try Basic Search
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <MapPin className="h-5 w-5 text-primary mb-2" />
              <CardTitle className="text-lg">Geographic Search</CardTitle>
              <CardDescription>
                Find properties within a specific radius
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Search using latitude and longitude coordinates with a customizable
                radius to discover properties in precise geographic areas.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <Link href="/attom-search">
                  <MapPin className="h-4 w-4 mr-2" />
                  Try Geo Search
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Building className="h-5 w-5 text-primary mb-2" />
              <CardTitle className="text-lg">Property Type Search</CardTitle>
              <CardDescription>
                Find specific types of properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Narrow your search to specific property types: Single Family, Condo,
                Townhouse, Multi-Family, or Land.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <Link href="/attom-search">
                  <Building className="h-4 w-4 mr-2" />
                  Try Property Type Search
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ATTOM API Search Features</CardTitle>
            <CardDescription>
              Learn about the powerful capabilities of our ATTOM API integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="address-search">
                <AccordionTrigger>Address Search</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    The Address Search allows you to find properties by entering a specific 
                    street address, city, and state. This is the most direct way to locate 
                    a specific property.
                  </p>
                  <p className="mb-2">
                    <strong>Usage Tips:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Enter a complete address for the most accurate results</li>
                    <li>Include city and state information for better matching</li>
                    <li>For broader results, you can enter just a street name</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="postal-search">
                <AccordionTrigger>Postal Code Search</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    Search for properties within a specific ZIP code area. This is useful 
                    when you're interested in a particular neighborhood or postal zone.
                  </p>
                  <p className="mb-2">
                    <strong>Usage Tips:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Enter a 5-digit ZIP code</li>
                    <li>Combine with property type filters for more specific results</li>
                    <li>ZIP code searches typically return comprehensive results</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="geo-search">
                <AccordionTrigger>Geographic Search</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    The Geographic Search allows you to find properties within a specific radius 
                    of a latitude/longitude point. This is perfect for finding properties near 
                    a specific location.
                  </p>
                  <p className="mb-2">
                    <strong>Usage Tips:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Enter latitude and longitude coordinates (e.g., 33.749, -84.388 for Atlanta)</li>
                    <li>Select a radius (1-50 miles) to define your search area</li>
                    <li>Smaller radius values provide more localized results</li>
                  </ul>
                  <p className="mt-2 text-sm">
                    <em>Tip: You can get coordinates by right-clicking on Google Maps and selecting "What's here?"</em>
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="property-type">
                <AccordionTrigger>Property Type Filtering</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    Filter properties by their type to narrow down your search results to 
                    exactly what you're looking for.
                  </p>
                  <p className="mb-2">
                    <strong>Available Property Types:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Single Family:</strong> Traditional detached homes</li>
                    <li><strong>Condo:</strong> Condominium units in multi-unit buildings</li>
                    <li><strong>Townhouse:</strong> Attached homes sharing one or more walls</li>
                    <li><strong>Multi-Family:</strong> Properties with multiple living units</li>
                    <li><strong>Land:</strong> Undeveloped land parcels</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="gap-2"
            asChild
          >
            <Link href="/attom-search">
              Try ATTOM Property Search
              <ChevronsRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default AttomSearchHelp;