function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("STATUS");
    dataset.addColumn("URL");

    var URL = fluigAPI.getPageService().getServerURL();
	
	dataset.addRow(["200", URL]);
    return dataset;
}