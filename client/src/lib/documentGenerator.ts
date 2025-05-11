import { jsPDF } from "jspdf";
import { default as autoTable } from 'jspdf-autotable';

/**
 * Generates a PDF document showcasing RealComp features and benefits
 */
export function generateFeaturesBenefitsPDF(): Promise<{ filename: string }> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(24);
      doc.setTextColor(44, 62, 80);
      doc.text("RealComp", doc.internal.pageSize.width / 2, 20, { align: "center" });
      
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Real Estate Comparison Tool", doc.internal.pageSize.width / 2, 30, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width / 2, 38, { align: "center" });
      
      // Add description
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const description = 
        "RealComp is a comprehensive real estate comparison and analysis platform designed " +
        "to empower real estate professionals with data-driven insights and automated workflows. " +
        "Our platform streamlines the property analysis process, helping you make better investment " +
        "decisions and provide superior service to your clients.";
      
      const splitDescription = doc.splitTextToSize(description, 170);
      doc.text(splitDescription, 20, 50);
      
      // Features and Benefits Section
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Key Features & Benefits", 20, 75);
      
      // Feature sections
      const features = [
        {
          title: "Property Analysis & Comparison",
          items: [
            "Interactive property search with advanced filtering",
            "Side-by-side property comparison tools",
            "Automated comparable property matching",
            "Customizable property valuation models",
            "Property history tracking and analysis"
          ]
        },
        {
          title: "Investment Analysis Tools",
          items: [
            "After Repair Value (ARV) calculation",
            "Maximum Allowable Offer (MAO) calculation",
            "Return on Investment (ROI) projections",
            "Cash flow analysis for rental properties",
            "Rehab cost estimator and integration"
          ]
        },
        {
          title: "Market Intelligence",
          items: [
            "Real-time market data and trends visualization",
            "Inventory level tracking across neighborhoods",
            "Days on Market analysis and projections",
            "Price per square foot comparative analysis",
            "Market health indicators and scoring"
          ]
        },
        {
          title: "Reports & Presentations",
          items: [
            "Customizable Comparative Market Analysis (CMA) reports",
            "Professional PDF report generation",
            "Client-ready property analysis documentation",
            "Shareable property portfolios",
            "Branded presentation materials"
          ]
        },
        {
          title: "Workflow Optimization",
          items: [
            "Save and organize property searches",
            "CSV/spreadsheet data import capabilities",
            "Property tagging and categorization",
            "MLS integration (with API access)",
            "Cloud synchronization across devices"
          ]
        }
      ];
      
      let yPosition = 85;
      
      features.forEach((section, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add section title
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.text(section.title, 20, yPosition);
        yPosition += 7;
        
        // Add section items
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        section.items.forEach(item => {
          doc.text("• " + item, 25, yPosition);
          yPosition += 7;
        });
        
        yPosition += 5;
      });
      
      // Add target audience
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Who Benefits from RealComp?", 20, yPosition);
      yPosition += 10;
      
      const audiences = [
        "Real Estate Investors seeking data-driven acquisition opportunities",
        "Property Flippers needing accurate ARV and rehab cost estimates",
        "Real Estate Agents creating professional client presentations",
        "Property Managers analyzing rental market conditions",
        "Real Estate Brokerages looking to provide superior market analysis tools"
      ];
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      audiences.forEach(audience => {
        doc.text("• " + audience, 25, yPosition);
        yPosition += 7;
      });
      
      // Add footer to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          'RealComp | www.realcomp.app | Contact: info@realcomp.app',
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      const filename = `RealComp_Features_Benefits_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      resolve({ filename });
    } catch (error) {
      console.error("Error generating features PDF:", error);
      reject(new Error(`Failed to generate features PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Generates a PDF document with technical specifications and hosting details
 */
export function generateTechnicalSpecPDF(): Promise<{ filename: string }> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(22);
      doc.setTextColor(44, 62, 80);
      doc.text("RealComp: Technical Specifications", doc.internal.pageSize.width / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width / 2, 30, { align: "center" });
      
      // Technical Overview
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Technical Overview", 20, 40);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const techOverview = 
        "RealComp is a modern web application built with a React frontend and Node.js backend. " +
        "The platform uses PostgreSQL for data storage and leverages several APIs for real estate data integration. " +
        "This document outlines the technical specifications, requirements, and deployment options for the application.";
      
      const splitOverview = doc.splitTextToSize(techOverview, 170);
      doc.text(splitOverview, 20, 50);
      
      // System Architecture
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("System Architecture", 20, 70);
      
      // Create system architecture table
      autoTable(doc, {
        startY: 75,
        head: [['Component', 'Technology', 'Description']],
        body: [
          ['Frontend', 'React, TypeScript, Tailwind CSS', 'Single-page application with responsive design'],
          ['Backend', 'Node.js, Express', 'RESTful API server handling data processing and business logic'],
          ['Database', 'PostgreSQL', 'Relational database for structured data storage'],
          ['ORM', 'Drizzle ORM', 'Type-safe database toolkit for TypeScript & Node.js'],
          ['Authentication', 'Passport.js', 'User authentication and session management'],
          ['Data Visualization', 'Recharts', 'Responsive charting and data visualization library'],
          ['Mapping', 'MapBox, Turf.js', 'Interactive mapping and geospatial analysis'],
          ['Document Generation', 'jsPDF, AutoTable', 'PDF report generation and export functionality']
        ],
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontSize: 12
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });
      
      // Technical Requirements
      const finalY1 = (doc as any)['lastAutoTable'].finalY || 150;
      
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Technical Requirements", 20, finalY1 + 15);
      
      // Hosting Requirements
      autoTable(doc, {
        startY: finalY1 + 20,
        head: [['Requirement', 'Specification']],
        body: [
          ['Node.js Version', 'v18.x or higher'],
          ['Database', 'PostgreSQL 14 or higher'],
          ['Memory', 'Minimum 2GB RAM (4GB+ recommended)'],
          ['Storage', 'Minimum 20GB SSD'],
          ['Bandwidth', 'Depends on user volume (1TB/month recommended)'],
          ['SSL Certificate', 'Required for secure connections']
        ],
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontSize: 12
        }
      });
      
      // External Services & API Keys
      const finalY2 = (doc as any)['lastAutoTable'].finalY || 150;
      
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("External Services & API Keys", 20, finalY2 + 15);
      
      // External Services table
      autoTable(doc, {
        startY: finalY2 + 20,
        head: [['Service', 'Purpose', 'Pricing (Estimated)']],
        body: [
          ['MLS API Access', 'Real estate listing data integration', 'Varies by MLS ($500-2000/month)'],
          ['MapBox API', 'Interactive mapping and location search', 'Free tier available, then $0.50 per 1000 requests'],
          ['Property Data API', 'Property history and valuation data', '$200-500/month based on volume'],
          ['SMTP Service', 'Email notifications and reports', '$20-50/month (SendGrid, Mailgun)']
        ],
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontSize: 12
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });
      
      // Add new page for deployment options
      doc.addPage();
      
      // Deployment Options
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Deployment Options", 20, 20);
      
      // Deployment table
      autoTable(doc, {
        startY: 25,
        head: [['Option', 'Pros', 'Cons']],
        body: [
          [
            'Self-Hosted (On-premise)', 
            '• Complete control\n• No ongoing service fees\n• Data privacy',
            '• Higher initial setup costs\n• Requires IT expertise\n• Responsibility for maintenance'
          ],
          [
            'Cloud Hosting (AWS, Azure, GCP)', 
            '• Scalability\n• Managed infrastructure\n• Geographic distribution',
            '• Monthly costs scale with usage\n• Some technical expertise required\n• Potential vendor lock-in'
          ],
          [
            'Platform-as-a-Service (Heroku, DigitalOcean)', 
            '• Simple deployment\n• Less maintenance overhead\n• Predictable pricing',
            '• Less customization\n• Higher long-term costs\n• Performance limitations'
          ]
        ],
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontSize: 12
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 60 },
          2: { cellWidth: 60 }
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });
      
      // Recommended Hosting Providers
      const finalY3 = (doc as any)['lastAutoTable'].finalY || 150;
      
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Recommended Hosting Options", 20, finalY3 + 15);
      
      // Hosting providers table
      autoTable(doc, {
        startY: finalY3 + 20,
        head: [['Provider', 'Tier', 'Monthly Cost (Est.)', 'Best For']],
        body: [
          ['DigitalOcean', 'Basic App Platform', '$25-50', 'Startups, low traffic'],
          ['DigitalOcean', 'Pro App Platform', '$100-200', 'Small to medium brokerages'],
          ['AWS Elastic Beanstalk', 'Standard Tier', '$150-300', 'Medium to large agencies'],
          ['Heroku', 'Standard Tier', '$50-150', 'Quick deployment, minimal IT'],
          ['Google Cloud Run', 'Pay-per-use', '$75-250', 'Variable traffic patterns']
        ],
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontSize: 12
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });
      
      // Add new page for hosting plans
      doc.addPage();
      
      // Managed Hosting Plans
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text("RealComp Managed Hosting Plans", doc.internal.pageSize.width / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const hostingDescription = 
        "For clients who prefer a hands-off approach, we offer fully managed hosting solutions that " +
        "include deployment, maintenance, updates, and technical support. Our managed hosting " +
        "ensures your RealComp instance remains stable, secure, and up-to-date.";
      
      const splitHosting = doc.splitTextToSize(hostingDescription, 170);
      doc.text(splitHosting, 20, 30);
      
      // Managed Hosting Plans table
      autoTable(doc, {
        startY: 45,
        head: [['Plan', 'Starter', 'Professional', 'Enterprise']],
        body: [
          ['Monthly Cost', '$99/month', '$299/month', '$799/month'],
          ['User Accounts', 'Up to 5', 'Up to 25', 'Unlimited'],
          ['Data Storage', '10GB', '50GB', '200GB'],
          ['Property Listings', 'Up to 1,000', 'Up to 10,000', 'Unlimited'],
          ['API Integrations', 'Basic', 'Advanced', 'Custom'],
          ['Email Reports', '100/month', '1,000/month', 'Unlimited'],
          ['PDF Exports', '100/month', '1,000/month', 'Unlimited'],
          ['Update Frequency', 'Quarterly', 'Monthly', 'Continuous'],
          ['Support', 'Email', 'Email & Phone', 'Priority 24/7'],
          ['Custom Branding', 'Basic', 'Full', 'White-label'],
          ['Uptime SLA', '99.5%', '99.9%', '99.99%'],
          ['Data Backups', 'Weekly', 'Daily', 'Hourly']
        ],
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontSize: 12
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });
      
      // Implementation Timeline
      const finalY4 = (doc as any)['lastAutoTable'].finalY || 150;
      
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Implementation Timeline", 20, finalY4 + 15);
      
      // Implementation steps
      autoTable(doc, {
        startY: finalY4 + 20,
        head: [['Phase', 'Timeline', 'Activities']],
        body: [
          ['Requirements Gathering', '1-2 weeks', 'Understand requirements, identify data sources, API access'],
          ['Setup & Configuration', '1-2 weeks', 'System deployment, database setup, environment configuration'],
          ['Data Integration', '2-4 weeks', 'Connect to MLS and property APIs, import initial data'],
          ['User Training', '1 week', 'Training sessions for administrators and end users'],
          ['Go-Live & Support', 'Ongoing', 'Final deployment, monitoring, and continuous support']
        ],
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontSize: 12
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });
      
      // Add footer to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          'RealComp Technical Specifications | Contact: tech@realcomp.app',
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      const filename = `RealComp_Technical_Specifications_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      resolve({ filename });
    } catch (error) {
      console.error("Error generating technical PDF:", error);
      reject(new Error(`Failed to generate technical PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}