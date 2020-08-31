<script>
    import { v4 } from "uuid";
    import { createEventDispatcher } from 'svelte';


    let dispatch = createEventDispatcher();

    let expen = {
        id : v4(),
        title: '',
        description: '',
        amount: '',
        label: '',
        complated: false
    }

    const addExpen = () => {
        const newExpen =({
        id : v4(),
        title: expen.title,
        description: expen.description,
        amount: expen.amount,
        label: expen.label,
        complated: false,
        })
        cleanExpen();
   dispatch('add', newExpen);
    }

    const cleanExpen = () => {
        expen = {
            id: v4(),
            title: '',
            description: '',
            amount: 0,
            label: '',
            complated: false,
        }
    }
    const SubmitHandler = () => {
        addExpen();
    }

</script>
<div class="container">
<form on:submit|preventDefault={SubmitHandler}>

    <div class="form-group">
        <div class="row">
            <div class="col-25">
        <label for="title"> Title :</label>
            </div>
            <div class="col-75">
        <input
        bind:value={expen.title}
        type="text"
        class="form-control"
        id="detail"
        placeholder="Title" />
    </div>
    </div>
    </div>
    <div class="form-group">
    <div class="row">
        <div class="col-25">
        <label for="description"> Description :</label>
        </div>
        <div class="col-75">
        <input
        bind:value={expen.description}
        type="text"
        class="form-control"
        id="detail"
        placeholder="Description" />
    </div>
    </div>
    </div>

    <div class="form-group">
        <div class="row">
            <div class="col-25">
        <label for="amount"> Amount :</label>
        </div>
        <div class="col-75">
        <input
        bind:value={expen.amount}
        type="number"
        class="form-control"
        id="detail"
        placeholder="amount" />
        </div>
    </div>
    </div>

    <div class="form-group">
        <div class="row">
            <div class="col-25">
        <label for="label"> Label :</label>
            </div>
            <div class="col-75">
        <select
        bind:value={expen.label}
        class="form-control"
        id="label">
        <option selected disabled>Select a Label</option>
        <option value="groceries">Groceries</option>
        <option value="bills">Bills</option>
        <option value="utilities">Utilities</option>
        <option value="personal">Personal</option>
        </select>
        </div>
    </div>
    </div>
    <div class="row">
        <center>
    <button type="submit" class="btn submit">Submit Now</button>
</center>
    </div>
</form>
</div>
<style>
    * {
  box-sizing: border-box;
}

input[type=text], select  {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

input[type=number], select  {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

label {
  padding: 12px 12px 12px 0;
  display: inline-block;
}

    .submit {
        background-color: #4CAF50;
        border-radius: 6px;
    } /* Green */
    .submit:hover {background-color: #46a049;}

    .btn {
        border: none;
        color: white;
        padding: 7px 14px;
        margin: 20px;
        font-size: 16px;
        cursor: pointer;
        
    }



.container {
  border-radius: 5px;
  background-color: #f2f2f2;
  padding: 20px;
}

.col-25 {
  float: left;
  width: 25%;
  margin-top: 6px;
}

.col-75 {
  float: left;
  width: 75%;
  margin-top: 6px;
}

/* Clear floats after the columns */
.row:after {
  content: "";
  display: table;
  clear: both;
}


</style>