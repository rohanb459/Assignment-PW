# PW - Assignment

Let's Slice and dice

# Description

1. An API to add a new record to the dataset.
2. An API to delete a new record to the dataset.
3. An API to fetch SS for salary over the entire dataset. You can ignore the currency (if not
mentioned otherwise) of the salary and simply treat salary as a number.
4. An API to fetch SS for salary for records which satisfy "on_contract": "true".
5. An API to fetch SS for salary for each department. This means that whatever you’ll do in
Step 3, should be done for each department. The return of this API should have 1 SS
available for each unique department.
6. An API to fetch SS for salary for each department and sub-department combination. This
is similar to Case 5 but 1 level of nested aggregation.

# Installation/ Running this Service

1. Navigate to the root folder of the project directory where app.js is present
2. Open command Line and run command `npm install`
3. There should have a sqlite database management tool to see the databases `usersDb.db` file and `employeesDb.db`
4. There should be software like Postman or Thunderclient installed on your machine to run the API.

# Examples of API Endpoints
DUMMY Credentials - Username = pw || password = pw123
1. Login User for Authentication
![image](https://github.com/rohanb459/Assignment-PW/assets/80480286/109bea9b-d3f1-46bf-b430-5aa248860481)
After login you will get a token as a cookie, use this token for futher api calls.

2. Register New User
   ![image](https://github.com/rohanb459/Assignment-PW/assets/80480286/38171d80-729a-4b77-b07b-73bb05d26b9d)

3. Add New Record
   ![image](https://github.com/rohanb459/Assignment-PW/assets/80480286/ac6fe78f-ae42-4490-834d-f86f255307e9)

4. Delete Record
   ![image](https://github.com/rohanb459/Assignment-PW/assets/80480286/3aa7a81e-cbf4-4745-adca-3835ff56b43a)
  
5. Fetch Salary stats for whole dataset
   ![image](https://github.com/rohanb459/Assignment-PW/assets/80480286/f36506b1-9029-408c-94b2-00749ef30fad)

6. Fetch Salary stats for records in which on_contract : true
   ![image](https://github.com/rohanb459/Assignment-PW/assets/80480286/d6a16174-c762-4c88-b20b-ff570d4a70f6)
   all the salaries are converted into INR to calculate MIn, MAX and Mean.

7.  fetch Salary Stats for salary for each department.

    ![image](https://github.com/rohanb459/Assignment-PW/assets/80480286/4bf90840-e8de-43da-ba4c-87307a26da00)

8. fetch Salary Stats for salary for each department and sub-department combination.
    
![image](https://github.com/rohanb459/Assignment-PW/assets/80480286/e51a9067-c960-4e30-a86b-e97e367fb58e)

# Testacase
1. Login
   
   req.body = {
    "username": "pw",
    "password": "pw123"
   }
2. Add new Record

   req.body = {
  "name": "Rohan",
  "salary": "50000", 
  "currency": "USD", 
  "department": "Engineering",
  "sub_department": "software"
}

3. Delete Record
   
   req.body= {
   "name": "Rohan",
    "department": "Engineering",
  "sub_department": "software"
}

4. SS for whole dataset/ each department/ each department and subdepartment combination
   
   empty req.body
   
   set cookie in req header

   



