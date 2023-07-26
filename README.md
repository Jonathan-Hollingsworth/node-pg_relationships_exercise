# node-pg_relationships_exercise

This application utilizes three main route sets to interact with the `biztime` database. (You will have to create it)  

## `/Companies`

You can get one specific company or all of them (`GET /companies/:code` or `GET /companies`)  
You can add edit and delete companies as well: (Required JSON will be given in parentheses)
> - `POST /companies` ({name, description}) (The code will be made automatically)
> - `PUT /companies/:code` ({name, description})
> - `DELETE /comapnies/:code`

## `/invoices`

You can get one specific invoice or all of them (`GET /invoices/:id` or `GET /invoices`)  
You can add edit and delete invoices as well: (Required JSON will be given in parentheses)
> - `POST /invoices` ({comp_code, amt})
> - `PUT /invoices/:id` ({amt})
> - `DELETE /invoices/:id`

## `/industries`

All of them will be displayed at once and there is no route for getting a specific one (`GET /inddustries`)  
You can add edit and delete industries as well: (Required JSON will be given in parentheses)
> - `POST /industries` ({code, industry}) (Not including a code will have the system make one for you)
> - `PUT /industries/:code` ({industry})
> - `DELETE /industries/:code`

You can even connect an industry to any number of companies (`POST /industries/company` ({comp_code, ind_code}))
