import { useState } from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MortgageCalculator from "@/components/MortgageCalculator";
import { Calculator, Coins, TrendingUp, Presentation } from "lucide-react";

const FinancialCalculatorsPage = () => {
  const [activeTab, setActiveTab] = useState("mortgage");

  return (
    <>
      <Helmet>
        <title>Financial Calculators | Real Estate Pro</title>
        <meta name="description" content="Calculate mortgage payments, investment returns, and more with our financial calculators." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#071224]">Financial Calculators</h1>
            <p className="text-gray-600 mt-1">
              Tools to help you make informed financial decisions
            </p>
          </div>
        </div>

        <Tabs defaultValue="mortgage" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-1 md:grid-cols-4 mb-8">
            <TabsTrigger value="mortgage" className="flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              Mortgage
            </TabsTrigger>
            <TabsTrigger value="investment" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Investment
            </TabsTrigger>
            <TabsTrigger value="affordability" className="flex items-center">
              <Coins className="h-4 w-4 mr-2" />
              Affordability
            </TabsTrigger>
            <TabsTrigger value="rent-vs-buy" className="flex items-center">
              <Presentation className="h-4 w-4 mr-2" />
              Rent vs. Buy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mortgage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MortgageCalculator propertyPrice={300000} interestRate={6.5} />
              </div>
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="bg-[#071224] text-white rounded-t-lg">
                    <CardTitle className="text-lg flex items-center">
                      <Calculator className="h-5 w-5 mr-2 text-[#FF7A00]" />
                      About Mortgage Calculations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4 bg-[#050e1d] text-slate-300">
                    <p className="text-sm text-slate-300">
                      This calculator helps estimate your monthly mortgage payments based on your loan amount, down payment, interest rate, and loan term.
                    </p>
                    <h3 className="font-semibold mt-4 text-white">Key Factors:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                      <li>
                        <span className="font-medium text-[#FF7A00]">Down payment:</span> Higher down payments reduce your loan amount and monthly payments.
                      </li>
                      <li>
                        <span className="font-medium text-[#FF7A00]">Interest rate:</span> Even small changes can significantly impact your monthly payment.
                      </li>
                      <li>
                        <span className="font-medium text-[#FF7A00]">Loan term:</span> Longer terms reduce monthly payments but increase total interest paid.
                      </li>
                    </ul>
                    <p className="text-sm text-slate-300 mt-4">
                      <strong className="text-[#FF7A00]">Note:</strong> This calculator provides estimates only. Actual payments may vary based on taxes, insurance, and other factors.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="investment" className="space-y-6">
            <Card className="w-full p-6 bg-[#050e1d] border-[#0f1d31]">
              <div className="flex items-center justify-center h-64">
                <p className="text-slate-400">Investment calculator coming soon</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="affordability" className="space-y-6">
            <Card className="w-full p-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Affordability calculator coming soon</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="rent-vs-buy" className="space-y-6">
            <Card className="w-full p-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Rent vs. Buy calculator coming soon</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default FinancialCalculatorsPage;