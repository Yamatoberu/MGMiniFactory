# MGMiniFactory
This will be the hub for all thing MG Mini Factory a place where customers can get their 3d models printed out
## MVP Requirements - Replace the Google Sheets page with this webpage
### Customer facing home page
<table>
  <thead>
    <tr>
      <th>Requirement</th>
      <th>Details</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Title Bar</td>
      <td>
        <ul>
          <li>
            MG Mini Factory Logo
            <ul>
              <li>Hyperlink to Home page</li>
            </ul>
          </li>
        </ul>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Navigation</td>
      <td>
        <ul>
          <li>
            Available Links
            <ul>
              <li>Home</li>
              <li>Quotes</li>
              <li>Orders</li>
            </ul>
          </li>
        </ul>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Body</td>
      <td>
        <ul>
          <li>Print Carousel</li>
        </ul>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Footer</td>
      <td>
        <ul><li>About Us Info</li></ul>
      </td>
      <td></td>
    </tr>
  </tbody>
</table>

### View list of print quotes
Create a table that will display the list of quotes that we have received
<table>
  <thead>
    <tr>
      <th>Requirement</th>
      <th>Details</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Table Data</td>
      <td>This data will be populated with the list of quotes that we have received</td>
      <td></td>
    </tr>
    <tr>
      <td>Table Columns</td>
      <td>
        <ul>
          <li>Name - Who requested the quote</li>
          <li>Date - When the quote was requested</li>
          <li>Summary - Name describing the order</li>
          <li>Print Type - Whether the print is FDM or Resin</li>
          <li>Material Cost</li>
          <li>Print Time</li>
          <li>Print Cost - Calculated Value</li>
          <li>Labor Time</li>
          <li>Labor Cost - Calculated Value</li>
          <li>Total Cost - Calculated Value</li>
          <li>Suggested Price - Calculated Value</li>
          <li>Quoted Price - The price quoted to the customer</li>
          <li>Status</li>
        </ul>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Table Actions</td>
      <td>
        <ul>
          <li>Double Click - Open quote dialog and allow the user to modify the quote</li>
          <li>Convert to Order - Creates order based on the quote and marks quote as "Converted"</li>
          <li>Abandon Quote - Set the status of the quote to "Abandoned"</li>
        </ul>
      </td>
      <td></td>
    </tr>
  </tbody>
</table>

### Generate print quotes
<table>
  <thead>
    <th>Requirements</th>
    <th>Details</th>
    <th>Notes</th>
  </thead>
  <tbody>
    <tr>
      <td>Create "Edit Quote" Dialog</td>
      <td>
        <ul>
          <li>Name - A text field for the customer's name</li>
          <li>Print Type - Combobox to select between resin and FDM</li>
          <li>Material Cost - Currency text field</li>
          <li>Print Time - Decimal text field</li>
          <li>Print Cost - Calculated Label</li>
          <li>Labor Time - Decimal text feild</li>
          <li>Labor Cost - Calculated Label</li>
          <li>Total Cost - Calculated Label</li>
          <li>Suggested Price - Calculated Label</li>
          <li>Quoted Price - Currency text field</li>
          <li>Status - Combobox that is populated with the quote statuses</li>
          <li>Accept Button - Creates/Edits quote and closes the dialog</li>
          <li>Cancel Button - Discards the changes and closes the dialog</li>
        </ul>
      </td>
      <td>
        <ul>
          <li>When any of the editable fields are modified, re-calculate the calculated fields</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>Add button above Quotes table to create a new quote</td>
      <td>Clicking the button will open a new instance of the "Edit Quote" dialog</td>
      <td></td>
    </tr>
  </tbody>
</table>
  
### View list of print orders
- Update order info
- all quote info, acutal price, print status, payment status
<table>
  <thead>
    <th>Requirements</th>
    <th>Details</th>
    <th>Notes</th>
  </thead>
  <tbody>
    <tr>
      <td>Table Data</td>
      <td>This table will be populated with all of the orders that have been created</td>
      <td></td>
    </tr>
    <tr>
      <td>Table Columns</td>
      <td>
        <ul>
          <li>Name - Customer Name</li>
          <li>Date - When the quote was requested</li>
          <li>Summary - Name describing the order</li>
          <li>Print Type - Whether the print is FDM or Resin</li>
          <li>Material Cost</li>
          <li>Print Time</li>
          <li>Print Cost - Calculated Value</li>
          <li>Labor Time</li>
          <li>Labor Cost - Calculated Value</li>
          <li>Total Cost - Calculated Value</li>
          <li>Suggested Price - Calculated Value</li>
          <li>Actual Price - The price quoted to the customer</li>
          <li>Is Paid - Boolean of whether the order has been paid for or not</li>
          <li>Order Status</li>
        </ul>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>Table Actions</td>
      <td>
        <ul>
          <li>Double-click - Open the "Edit Order" dialog</li>
          <li>Mark as Paid</li>
          <li>Complete Order</li>
      </td>
      <td></td>
    </tr>
  </tbody>
</table>

### Convert quotes to print order
<table>
  <thead>
    <th>Requirements</th>
    <th>Details</th>
    <th>Notes</th>
  </thead>
  <tbody>
    <tr>
      <td>Create "Edit Order" dialog</td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>

## Future enhancements
* Quote request process
* Enable login for admin
* View dashboard to view key metrics
* View and manage print queue
* Track printer maintenance
