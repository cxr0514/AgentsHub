import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { AlertCircle, DollarSign, Percent, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MortgageCalculatorProps {
  propertyPrice?: number;
  interestRate?: number;
}

const MortgageCalculator = ({ 
  propertyPrice = 300000, 
  interestRate = 6.5 
}: MortgageCalculatorProps) => {
  const [loanAmount, setLoanAmount] = useState<number>(propertyPrice);
  const [downPayment, setDownPayment] = useState<number>(propertyPrice * 0.2);
  const [rate, setRate] = useState<number>(interestRate);
  const [term, setTerm] = useState<number>(30);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);

  useEffect(() => {
    calculateMortgage();
  }, [loanAmount, downPayment, rate, term]);

  const calculateMortgage = () => {
    const principal = loanAmount - downPayment;
    if (principal <= 0 || rate <= 0 || term <= 0) {
      setMonthlyPayment(0);
      setTotalInterest(0);
      setTotalPayment(0);
      return;
    }

    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = term * 12;
    
    // Monthly payment formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    const monthlyPaymentAmount = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    setMonthlyPayment(monthlyPaymentAmount);
    setTotalPayment(monthlyPaymentAmount * numberOfPayments);
    setTotalInterest(monthlyPaymentAmount * numberOfPayments - principal);
  };

  const handlePropertyPriceChange = (value: string) => {
    const priceValue = parseFloat(value);
    if (!isNaN(priceValue) && priceValue > 0) {
      setLoanAmount(priceValue);
      // Adjust down payment to maintain the same percentage
      const currentPercentage = downPayment / loanAmount;
      setDownPayment(priceValue * currentPercentage);
    }
  };

  const handleDownPaymentChange = (value: string) => {
    const dpValue = parseFloat(value);
    if (!isNaN(dpValue) && dpValue >= 0 && dpValue < loanAmount) {
      setDownPayment(dpValue);
    }
  };

  const handleDownPaymentPercentChange = (value: number[]) => {
    const percentage = value[0];
    setDownPayment(loanAmount * (percentage / 100));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const downPaymentPercentage = loanAmount > 0 ? (downPayment / loanAmount) * 100 : 0;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-[#071224] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-[#FF7A00]" />
          Mortgage Calculator
        </CardTitle>
        <CardDescription className="text-gray-300">
          Estimate your monthly mortgage payments
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4 bg-[#050e1d] text-slate-300">
        <div className="space-y-2">
          <Label htmlFor="property-price" className="flex items-center text-white">
            Property Price
          </Label>
          <div className="relative">
            <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-gray-500" />
            <Input
              id="property-price"
              type="number"
              value={loanAmount}
              onChange={(e) => handlePropertyPriceChange(e.target.value)}
              className="pl-9 bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="down-payment" className="flex items-center text-white">
              Down Payment ({formatPercentage(downPaymentPercentage)})
            </Label>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(downPayment)}
            </span>
          </div>
          <div className="relative">
            <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-gray-500" />
            <Input
              id="down-payment"
              type="number"
              value={downPayment}
              onChange={(e) => handleDownPaymentChange(e.target.value)}
              className="pl-9 bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500"
            />
          </div>
          <Slider
            defaultValue={[20]}
            max={50}
            step={1}
            value={[downPaymentPercentage]}
            onValueChange={handleDownPaymentPercentChange}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="interest-rate" className="flex items-center text-white">
              Interest Rate
            </Label>
            <div className="relative">
              <Percent className="absolute top-2.5 left-3 h-4 w-4 text-[#FF7A00]" />
              <Input
                id="interest-rate"
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="pl-9 bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-term" className="flex items-center text-white">
              Loan Term (Years)
            </Label>
            <div className="relative">
              <Calendar className="absolute top-2.5 left-3 h-4 w-4 text-[#FF7A00]" />
              <Input
                id="loan-term"
                type="number"
                value={term}
                onChange={(e) => setTerm(parseInt(e.target.value))}
                className="pl-9 bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {monthlyPayment > 0 && (
          <div className="mt-6 space-y-4">
            <div className="bg-[#0f1d31] rounded-lg p-4 text-white">
              <h3 className="text-lg font-semibold mb-2">Monthly Payment</h3>
              <span className="text-2xl font-bold text-[#FF7A00]">
                {formatCurrency(monthlyPayment)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm text-muted-foreground">Principal Amount</h4>
                <p className="text-lg font-semibold">{formatCurrency(loanAmount - downPayment)}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm text-muted-foreground">Total Interest</h4>
                <p className="text-lg font-semibold">{formatCurrency(totalInterest)}</p>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm text-muted-foreground">Total Payment (over {term} years)</h4>
              <p className="text-lg font-semibold">{formatCurrency(totalPayment)}</p>
            </div>
          </div>
        )}

        {(loanAmount - downPayment <= 0) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Inputs</AlertTitle>
            <AlertDescription>
              Down payment cannot be greater than or equal to the property price.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MortgageCalculator;